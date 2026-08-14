"use client";

import React, { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MapPin, ChevronLeft, Heart, Wifi, Waves, Utensils, Car, Wind, Tv, Shield, Users, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Listing, Review } from "@/types";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { ErrorState } from "@/components/ErrorState";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-zinc-50 border border-border-gray rounded-2xl flex items-center justify-center text-xs text-muted">
      Loading location map...
    </div>
  ),
});

// Maps Lucide icons to specific amenity keywords
const getAmenityIcon = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes("wi-fi") || norm.includes("wifi") || norm.includes("internet")) return <Wifi size={18} className="text-dark" />;
  if (norm.includes("pool") || norm.includes("swimming")) return <Waves size={18} className="text-dark" />;
  if (norm.includes("kitchen") || norm.includes("cooking")) return <Utensils size={18} className="text-dark" />;
  if (norm.includes("parking") || norm.includes("garage") || norm.includes("car")) return <Car size={18} className="text-dark" />;
  if (norm.includes("ac") || norm.includes("air cond") || norm.includes("cooling")) return <Wind size={18} className="text-dark" />;
  if (norm.includes("tv") || norm.includes("television") || norm.includes("cable")) return <Tv size={18} className="text-dark" />;
  return <Shield size={18} className="text-dark" />;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Resolve promise params
  const resolvedParams = use(params);
  const listingId = Number(resolvedParams.id);

  // States
  const [listing, setListing] = useState<Listing | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Booking widget states
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review submission states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingData, availabilityData, reviewsData] = await Promise.all([
        api.listings.getListing(listingId),
        api.listings.getBlockedDates(listingId),
        api.reviews.getReviews(listingId),
      ]);
      setListing(listingData);
      setBlockedDates(availabilityData.blocked_dates);
      setReviews(reviewsData);
    } catch (err: any) {
      console.error("Failed to load listing details", err);
      setError(err.message || "Failed to retrieve listing details.");
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (user) {
      try {
        const wishlist = await api.wishlist.getWishlist();
        const saved = wishlist.some((item) => item.listing_id === listingId);
        setIsWishlisted(saved);
      } catch (err) {
        console.error("Failed to query wishlist status", err);
      }
    } else {
      setIsWishlisted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [listingId]);

  useEffect(() => {
    checkWishlistStatus();
  }, [listingId, user]);

  const toggleWishlist = async () => {
    if (!user) {
      showToast("Please log in or register to save items to your wishlist!", "info");
      return;
    }
    try {
      if (isWishlisted) {
        await api.wishlist.removeFromWishlist(listingId);
        setIsWishlisted(false);
        showToast("Stay removed from your wishlist.", "info");
      } else {
        await api.wishlist.addToWishlist(listingId);
        setIsWishlisted(true);
        showToast("Stay saved to your wishlist!", "success");
      }
    } catch (err: any) {
      console.error("Failed to toggle wishlist", err);
      showToast(err.message || "Failed to update wishlist.", "error");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length < 2) {
      setReviewError("Comment must be at least 2 characters long.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      await api.reviews.createReview(listingId, {
        rating: newRating,
        comment: newComment,
      });
      setReviewSuccess(true);
      setNewComment("");
      setNewRating(5);
      showToast("Review submitted successfully!", "success");

      // Reload reviews and listing details (recalculates stats)
      const [reviewsData, listingData] = await Promise.all([
        api.reviews.getReviews(listingId),
        api.listings.getListing(listingId),
      ]);
      setReviews(reviewsData);
      setListing(listingData);
    } catch (err: any) {
      console.error("Failed to submit review", err);
      const errMsg = err.message || "You must have a confirmed booking to review this stay.";
      setReviewError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in or register before reserving a stay.", "info");
      return;
    }

    if (!checkIn || !checkOut) {
      showToast("Please select check-in and check-out dates.", "info");
      return;
    }

    setBookingLoading(true);
    try {
      const newBooking = await api.bookings.createBooking({
        listing_id: listing!.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
      });
      showToast("Reservation successful! Redirecting to checkout...", "success");
      router.push(`/checkout/${newBooking.id}`);
    } catch (err: any) {
      const errMsg = err.message || "Failed to make booking. The dates might have been booked in the meantime.";
      showToast(errMsg, "error");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (error || !listing) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Listing Not Found"
          message={error || "The listing you are trying to view does not exist or has been archived."}
          onRetry={fetchData}
        />
        <div className="text-center mt-6">
          <Link href="/" className="text-brand font-bold hover:underline inline-flex items-center gap-1.5 text-sm">
            <ChevronLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Gallery setups
  const galleryImages = listing.images && listing.images.length > 0
    ? listing.images.map(img => img.image_url)
    : [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80"
      ];

  // Fill array to at least 5 images for the standard photo grid
  while (galleryImages.length < 5 && galleryImages.length > 0) {
    galleryImages.push(galleryImages[0]);
  }

  // Calculate pricing breakdown in sync with the backend
  let nights = 0;
  let subtotal = 0;
  let cleaningFee = 0;
  let serviceFee = 0;
  let totalPrice = 0;

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
    subtotal = listing.price_per_night * nights;
    cleaningFee = subtotal * 0.15;
    serviceFee = subtotal * 0.10;
    totalPrice = subtotal + cleaningFee + serviceFee;
  }

  // Calculate average rating dynamically
  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(2)
    : "New";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-2">
      
      {/* Title & Metadata Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark">{listing.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-semibold text-dark">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-dark stroke-dark" />
              <span>{avgRating}</span>
              {reviewsCount > 0 && <span className="text-muted font-normal">({reviewsCount} review{reviewsCount !== 1 ? "s" : ""})</span>}
            </span>
            <span className="text-border-gray">·</span>
            <span className="flex items-center gap-1 hover:underline cursor-pointer">
              <MapPin size={14} />
              <span>{listing.location_city}, {listing.location_country}</span>
            </span>
          </div>
          
          <button
            onClick={toggleWishlist}
            className="flex items-center gap-2 hover:bg-light-gray py-2 px-3 rounded-xl transition-all cursor-pointer"
          >
            <Heart size={16} className={isWishlisted ? "fill-brand stroke-brand" : "text-dark"} />
            <span>{isWishlisted ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[21/10] bg-zinc-100 relative group/gallery">
        <div className="md:col-span-2 md:row-span-2 overflow-hidden h-full">
          <img
            src={galleryImages[0]}
            alt={`${listing.title} Main`}
            className="w-full h-full object-cover hover:opacity-90 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
          />
        </div>
        <div className="hidden md:block overflow-hidden h-full">
          <img
            src={galleryImages[1]}
            alt={`${listing.title} Grid 1`}
            className="w-full h-full object-cover hover:opacity-90 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
          />
        </div>
        <div className="hidden md:block overflow-hidden h-full">
          <img
            src={galleryImages[2]}
            alt={`${listing.title} Grid 2`}
            className="w-full h-full object-cover hover:opacity-90 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
          />
        </div>
        <div className="hidden md:block overflow-hidden h-full">
          <img
            src={galleryImages[3]}
            alt={`${listing.title} Grid 3`}
            className="w-full h-full object-cover hover:opacity-90 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
          />
        </div>
        <div className="hidden md:block overflow-hidden h-full">
          <img
            src={galleryImages[4]}
            alt={`${listing.title} Grid 4`}
            className="w-full h-full object-cover hover:opacity-90 hover:scale-[1.01] transition-all duration-300 cursor-pointer"
          />
        </div>
      </div>

      {/* Detail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4 relative">
        
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <div className="border-b border-border-gray pb-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-dark">
                Entire cabin hosted by {listing.host.name}
              </h2>
              <p className="text-sm text-muted">
                {listing.guests_count} guest{listing.guests_count !== 1 ? "s" : ""} · {listing.bedrooms_count} bedroom{listing.bedrooms_count !== 1 ? "s" : ""} · {listing.bathrooms_count} bath{listing.bathrooms_count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
              {listing.host.avatar_url ? (
                <img src={listing.host.avatar_url} alt={listing.host.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold bg-muted text-lg">
                  {listing.host.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-border-gray pb-6">
            <h3 className="text-lg font-bold text-dark mb-3">About this space</h3>
            <p className="text-sm leading-relaxed text-dark whitespace-pre-line">{listing.description}</p>
          </div>

          <div className="border-b border-border-gray pb-6">
            <h3 className="text-lg font-bold text-dark mb-4">What this place offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listing.amenities.map((am) => (
                <div key={am.id} className="flex items-center gap-3.5 text-sm font-semibold text-dark">
                  {getAmenityIcon(am.name)}
                  <span>{am.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-border-gray pb-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-dark">Select check-in & check-out dates</h3>
            <p className="text-xs text-muted -mt-2">Blocked dates are greyed out or crossed off</p>
            <div className="max-w-md bg-white border border-border-gray p-6 rounded-2xl shadow-xs">
              <CalendarPicker
                blockedDates={blockedDates}
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={(inDate, outDate) => {
                  setCheckIn(inDate);
                  setCheckOut(outDate);
                }}
              />
            </div>
          </div>

          {/* Location Map Section */}
          <div className="border-b border-border-gray pb-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-dark">Where you'll be</h3>
            <p className="text-sm font-semibold text-dark -mt-2 flex items-center gap-1.5">
              <MapPin size={16} />
              <span>{listing.location_city}, {listing.location_country}</span>
            </p>
            <div className="w-full h-[320px] rounded-2xl overflow-hidden mt-1">
              <ListingMap
                listings={[listing]}
                center={listing.latitude && listing.longitude ? [listing.latitude, listing.longitude] : undefined}
                zoom={14}
                singleListing={true}
              />
            </div>
          </div>

          {/* Dynamic Reviews Section */}
          <div className="pb-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Star size={18} className="fill-dark stroke-dark" />
              <h3 className="text-lg font-bold text-dark">
                {avgRating} · {reviewsCount} review{reviewsCount !== 1 ? "s" : ""}
              </h3>
            </div>
            
            {/* Reviews list */}
            {reviewsCount === 0 ? (
              <p className="text-xs text-muted italic">No reviews submitted yet for this stay.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="flex flex-col gap-2 p-4 border border-border-gray rounded-2xl bg-light-gray/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-300 flex items-center justify-center font-bold text-dark text-xs uppercase">
                        {rev.guest.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-dark">{rev.guest.name}</span>
                        <span className="text-[10px] text-muted">
                          {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-brand">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < rev.rating ? "fill-brand stroke-brand" : "stroke-brand fill-transparent"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-dark leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Review Submission Form */}
            {user && (
              <form onSubmit={handleReviewSubmit} className="mt-8 border-t border-border-gray pt-6 flex flex-col gap-4 max-w-md">
                <h4 className="text-sm font-bold text-dark uppercase tracking-wide">Write a Review</h4>
                <p className="text-xs text-muted -mt-2">Only guests with confirmed stays can submit reviews.</p>
                
                {reviewError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-lg font-medium">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-xs text-emerald-600 rounded-lg font-medium">
                    Review submitted successfully!
                  </div>
                )}

                {/* Interactive Star Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-dark">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        disabled={reviewSubmitting}
                        className="focus:outline-none cursor-pointer"
                      >
                        <Star
                          size={18}
                          className={`
                            transition-all
                            ${
                              star <= newRating
                                ? "fill-brand stroke-brand scale-110"
                                : "stroke-brand fill-transparent"
                            }
                          `}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-dark uppercase tracking-wider">Comment</label>
                  <textarea
                    placeholder="Share your stay experience..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={reviewSubmitting}
                    className="w-full border border-border-gray focus:border-dark rounded-xl p-3.5 text-xs transition-all focus:outline-none bg-white text-dark min-h-[4rem]"
                    required
                  />
                </div>

                <Button type="submit" variant="brand" isLoading={reviewSubmitting} className="py-2.5 font-semibold text-xs self-start px-6">
                  Submit Review
                </Button>
              </form>
            )}
          </div>

        </div>

        {/* Right Column (Sticky Booking Widget) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-28 border border-border-gray rounded-2xl p-6 shadow-premium bg-white flex flex-col gap-5">
            
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1 text-dark">
                <span className="text-xl font-bold">₹{listing.price_per_night.toLocaleString("en-IN")}</span>
                <span className="text-xs text-muted">night</span>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-dark">
                <Star size={12} className="fill-dark stroke-dark" />
                <span>{avgRating}</span>
              </span>
            </div>

            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              
              <div className="border border-border-gray rounded-xl overflow-hidden divide-y divide-border-gray text-xs">
                <div className="grid grid-cols-2 divide-x divide-border-gray">
                  <div className="p-3.5 flex flex-col gap-0.5 cursor-pointer">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-dark">Check-in</span>
                    <span className="text-muted truncate">{checkIn || "Add date"}</span>
                  </div>
                  <div className="p-3.5 flex flex-col gap-0.5 cursor-pointer">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-dark">Checkout</span>
                    <span className="text-muted truncate">{checkOut || "Add date"}</span>
                  </div>
                </div>
                
                <div className="p-3.5 flex flex-col gap-1">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-dark">Guests limit</span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-dark font-semibold">
                      <Users size={12} />
                      <span>{guestsCount} guest{guestsCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.max(1, g - 1))}
                        disabled={guestsCount <= 1 || bookingLoading}
                        className="w-6 h-6 rounded-full border border-border-gray flex items-center justify-center text-dark disabled:opacity-30 transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.min(listing.guests_count, g + 1))}
                        disabled={guestsCount >= listing.guests_count || bookingLoading}
                        className="w-6 h-6 rounded-full border border-border-gray flex items-center justify-center text-dark disabled:opacity-30 transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" variant="brand" fullWidth isLoading={bookingLoading} className="py-3 font-semibold">
                Reserve stay
              </Button>

              <p className="text-[10px] text-muted text-center leading-relaxed">
                You won't be charged yet. Confirmed immediately under exclusive transaction safety.
              </p>

              {checkIn && checkOut && (
                <div className="flex flex-col gap-3 mt-2 border-t border-border-gray pt-4 text-sm">
                  <div className="flex items-center justify-between text-dark">
                    <span className="underline decoration-muted underline-offset-4">
                      ₹{listing.price_per_night.toLocaleString("en-IN")} x {nights} nights
                    </span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-dark">
                    <span className="underline decoration-muted underline-offset-4">Cleaning fee (15%)</span>
                    <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-dark">
                    <span className="underline decoration-muted underline-offset-4">Service fee (10%)</span>
                    <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-gray pt-3 font-bold text-dark text-base">
                    <span>Total price</span>
                    <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
