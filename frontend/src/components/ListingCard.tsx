import React from "react";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onToggleSave?: (listingId: number) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isSaved = false,
  onToggleSave,
}) => {
  const { user } = useAuth();

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please log in or register using the profile menu to save items to your wishlist!");
      return;
    }

    if (onToggleSave) {
      onToggleSave(listing.id);
    }
  };

  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

  // Dynamic reviews rating calculations
  const reviewsCount = listing.reviews?.length || 0;
  const avgRating = reviewsCount > 0 && listing.reviews
    ? (listing.reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviewsCount).toFixed(2)
    : "New";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col gap-2 w-full cursor-pointer transition-transform duration-200"
    >
      {/* Property Image Container */}
      <div className="relative aspect-square sm:aspect-[20/19] w-full overflow-hidden rounded-xl bg-zinc-100">
        <img
          src={imageUrl}
          alt={listing.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 active:scale-95 transition-all text-white hover:text-white/90 drop-shadow-sm focus:outline-none"
          aria-label="Save to wishlist"
        >
          <Heart
            size={22}
            className={`
              transition-all stroke-white stroke-[2.2]
              ${
                isSaved
                  ? "fill-brand stroke-brand scale-110"
                  : "fill-black/30 hover:fill-black/40"
              }
            `}
          />
        </button>

        {/* Category Badge overlay */}
        <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-dark">
          {listing.category}
        </div>
      </div>

      {/* Text Description Grid */}
      <div className="flex flex-col gap-1.5 px-0.5 mt-1">
        <div className="flex items-start justify-between gap-2">
          {/* Location */}
          <h3 className="text-sm font-bold text-dark truncate">
            {listing.location_city}, {listing.location_country}
          </h3>

          {/* Star Rating */}
          <span className="flex items-center gap-1 text-xs font-semibold text-dark">
            <Star size={12} className="fill-dark stroke-dark" />
            <span>{avgRating}</span>
            {reviewsCount > 0 && <span className="text-muted font-normal text-[10px]">({reviewsCount})</span>}
          </span>
        </div>

        {/* Title / Spec */}
        <p className="text-xs text-muted truncate">
          {listing.title}
        </p>

        {/* Bedrooms / Capacity */}
        <p className="text-xs text-muted">
          {listing.guests_count} guest{listing.guests_count !== 1 ? "s" : ""} · {listing.bedrooms_count} bedroom{listing.bedrooms_count !== 1 ? "s" : ""}
        </p>

        {/* Pricing breakdown */}
        <p className="text-sm font-bold text-dark mt-0.5">
          ₹{listing.price_per_night.toLocaleString("en-IN")}{" "}
          <span className="font-normal text-muted text-xs">night</span>
        </p>
      </div>
    </Link>
  );
};
export default ListingCard;
