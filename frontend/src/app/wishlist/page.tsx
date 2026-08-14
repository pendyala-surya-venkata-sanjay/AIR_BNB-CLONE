"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Compass, LogIn, Plane, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Wishlist, Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ListingCard } from "@/components/ListingCard";
import { useToast } from "@/context/ToastContext";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();

  // Wishlist listings state
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local login form state (for unauthenticated view)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.wishlist.getWishlist();
      setWishlistItems(data);
    } catch (err: any) {
      console.error("Failed to load wishlist", err);
      setError(err.message || "Failed to load wishlisted stays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login({ email, password });
      showToast("Welcome back! Logged in successfully.", "success");
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please try again.";
      setLoginError(msg);
      showToast(msg, "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (listingId: number) => {
    try {
      await api.wishlist.removeFromWishlist(listingId);
      // Update local state without full reload
      setWishlistItems((prev) => prev.filter((item) => item.listing_id !== listingId));
      showToast("Stay removed from your wishlist.", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to remove item from wishlist.", "error");
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // 1. UNAUTHENTICATED PROMPT STATE
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="p-4 bg-light-gray text-muted rounded-full">
            <Heart size={36} className="text-muted fill-transparent stroke-[1.8]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-dark">Wishlists</h1>
          <p className="text-sm text-muted">
            Log in to view or create wishlists, and save your favorite listings.
          </p>
        </div>

        <form onSubmit={handleLocalLoginSubmit} className="bg-white border border-border-gray p-6 rounded-2xl shadow-card flex flex-col gap-4">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-3 mb-2">Guest Log In</h3>
          
          {loginError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {loginError}
            </div>
          )}

          <Input
            type="email"
            label="Email address"
            placeholder="e.g. john@guest.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loginLoading}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginLoading}
            required
          />

          <Button type="submit" variant="brand" fullWidth isLoading={loginLoading} className="py-3 font-semibold mt-2">
            Log In
          </Button>
        </form>
      </div>
    );
  }

  // 2. LOADING STATE
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 animate-pulse mt-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="w-full flex flex-col gap-3">
              <div className="relative aspect-square w-full rounded-xl bg-zinc-100" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. API LOAD ERROR STATE
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto py-12">
        <ErrorState
          title="Could not load your wishlist"
          message={error}
          onRetry={fetchWishlist}
        />
      </div>
    );
  }

  // 4. EMPTY WISHLIST STATE
  if (wishlistItems.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4">
        <EmptyState
          title="Create your first wishlist"
          description="As you search, click the heart icon on your favorite stays to save them here."
          actionText="Explore stays"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-2 px-4 sm:px-6 flex flex-col gap-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark">Wishlist</h1>
      
      {/* Saved Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 animate-fade-in">
        {wishlistItems.map((item) => (
          <ListingCard
            key={item.id}
            listing={item.listing}
            isSaved={true}
            onToggleSave={() => handleRemoveFromWishlist(item.listing_id)}
          />
        ))}
      </div>
    </div>
  );
}
