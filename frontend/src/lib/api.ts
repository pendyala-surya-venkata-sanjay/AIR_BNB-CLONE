import { User, Listing, Booking, AuthResponse, Review, Wishlist } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// Token management helpers
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("airbnb_token");
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("airbnb_token", token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("airbnb_token");
  }
};

// Generic fetch wrapper with automatic JWT inject
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Body not JSON
    }
    throw new ApiError(response.status, errorDetail);
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// API Methods
export const api = {
  // Authentication
  auth: {
    async register(payload: Record<string, any>): Promise<User> {
      return apiFetch<User>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    
    async login(payload: Record<string, any>): Promise<AuthResponse> {
      const data = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      return data;
    },
    
    async getMe(): Promise<User> {
      return apiFetch<User>("/api/auth/me");
    },
    
    logout(): void {
      removeAuthToken();
    }
  },

  // Listings
  listings: {
    async getListings(params: {
      category?: string;
      min_price?: number;
      max_price?: number;
      location?: string;
      guests?: number;
      check_in?: string;
      check_out?: string;
      page?: number;
      limit?: number;
      amenities?: string[];
    } = {}): Promise<Listing[]> {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (item !== undefined && item !== null && item !== "") {
                searchParams.append(key, String(item));
              }
            });
          } else if (val !== "") {
            searchParams.append(key, String(val));
          }
        }
      });
      
      const queryStr = searchParams.toString();
      const path = `/api/listings/${queryStr ? `?${queryStr}` : ""}`;
      return apiFetch<Listing[]>(path);
    },

    async getListing(id: number): Promise<Listing> {
      return apiFetch<Listing>(`/api/listings/${id}`);
    },

    async createListing(payload: Record<string, any>): Promise<Listing> {
      return apiFetch<Listing>("/api/listings/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateListing(id: number, payload: Record<string, any>): Promise<Listing> {
      return apiFetch<Listing>(`/api/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    async deleteListing(id: number): Promise<void> {
      return apiFetch<void>(`/api/listings/${id}`, {
        method: "DELETE",
      });
    },

    async getBlockedDates(id: number): Promise<{ blocked_dates: string[] }> {
      return apiFetch<{ blocked_dates: string[] }>(`/api/listings/${id}/availability`);
    }
  },

  // Bookings
  bookings: {
    async createBooking(payload: {
      listing_id: number;
      check_in: string;
      check_out: string;
      guests_count: number;
    }): Promise<Booking> {
      return apiFetch<Booking>("/api/bookings/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async getMyTrips(): Promise<Booking[]> {
      return apiFetch<Booking[]>("/api/bookings/my-trips");
    },

    async getBooking(id: number): Promise<Booking> {
      return apiFetch<Booking>(`/api/bookings/${id}`);
    },

    async cancelBooking(id: number): Promise<Booking> {
      return apiFetch<Booking>(`/api/bookings/${id}/cancel`, {
        method: "POST",
      });
    }
  },

  // Host Dashboard
  host: {
    async getListings(): Promise<Listing[]> {
      return apiFetch<Listing[]>("/api/host/listings");
    },

    async getBookings(): Promise<Booking[]> {
      return apiFetch<Booking[]>("/api/host/bookings");
    }
  },

  // Wishlist
  wishlist: {
    async getWishlist(): Promise<Wishlist[]> {
      return apiFetch<Wishlist[]>("/api/wishlist/");
    },
    async addToWishlist(listingId: number): Promise<Wishlist> {
      return apiFetch<Wishlist>(`/api/wishlist/${listingId}`, {
        method: "POST",
      });
    },
    async removeFromWishlist(listingId: number): Promise<void> {
      return apiFetch<void>(`/api/wishlist/${listingId}`, {
        method: "DELETE",
      });
    }
  },

  // Reviews
  reviews: {
    async getReviews(listingId: number): Promise<Review[]> {
      return apiFetch<Review[]>(`/api/listings/${listingId}/reviews`);
    },
    async createReview(listingId: number, payload: { rating: number; comment: string }): Promise<Review> {
      return apiFetch<Review>(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
  }
};
