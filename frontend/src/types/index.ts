export interface User {
  id: number;
  name: string;
  email: string;
  role: "guest" | "host";
  avatar_url?: string;
  created_at: string;
}

export interface ListingImage {
  id: number;
  image_url: string;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface Listing {
  id: number;
  host_id: number;
  host: User;
  title: string;
  description: string;
  category: string;
  price_per_night: number;
  location_city: string;
  location_country: string;
  guests_count: number;
  bedrooms_count: number;
  bathrooms_count: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  images: ListingImage[];
  amenities: Amenity[];
  reviews?: Review[];
}

export interface Booking {
  id: number;
  listing_id: number;
  listing: Listing;
  guest_id: number;
  guest: User;
  check_in: string; // ISO date format YYYY-MM-DD
  check_out: string; // ISO date format YYYY-MM-DD
  guests_count: number;
  nightly_price: number;
  number_of_nights: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: "confirmed" | "cancelled";
  created_at: string;
}

export interface Review {
  id: number;
  listing_id: number;
  guest_id: number;
  guest: User;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
}

export interface Wishlist {
  id: number;
  user_id: number;
  listing_id: number;
  listing: Listing;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
