"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Umbrella, Home as CabinIcon, Building, Building2, Crown, Globe as DomeIcon, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ListingCard } from "@/components/ListingCard";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FilterModal } from "@/components/FilterModal";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-zinc-50 border border-border-gray rounded-2xl flex items-center justify-center text-xs text-muted">
      Loading map stays...
    </div>
  ),
});

// Horizontal scrollable categories mapping
const CATEGORIES = [
  { name: "Beachfront", icon: Umbrella },
  { name: "Cabins", icon: CabinIcon },
  { name: "Lofts", icon: Building },
  { name: "Townhouses", icon: Building2 },
  { name: "Mansions", icon: Crown },
  { name: "Domes", icon: DomeIcon },
];

function ListingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-3 animate-pulse">
      <div className="relative aspect-square sm:aspect-[20/19] w-full rounded-xl bg-zinc-200" />
      <div className="h-4 bg-zinc-200 rounded-sm w-3/4 mt-1" />
      <div className="h-3 bg-zinc-200 rounded-sm w-1/2" />
      <div className="h-3 bg-zinc-200 rounded-sm w-1/3" />
      <div className="h-4 bg-zinc-200 rounded-sm w-1/4 mt-1" />
    </div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const fetchWishlist = async () => {
    if (user) {
      try {
        const data = await api.wishlist.getWishlist();
        setSavedListingIds(data.map((w) => w.listing_id));
      } catch (err) {
        console.error("Failed to fetch user wishlist", err);
      }
    } else {
      setSavedListingIds([]);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleToggleSave = async (listingId: number) => {
    if (!user) return;
    const isSaved = savedListingIds.includes(listingId);
    try {
      if (isSaved) {
        await api.wishlist.removeFromWishlist(listingId);
        setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
        showToast("Stay removed from your wishlist.", "info");
      } else {
        await api.wishlist.addToWishlist(listingId);
        setSavedListingIds((prev) => [...prev, listingId]);
        showToast("Stay saved to your wishlist!", "success");
      }
    } catch (err: any) {
      console.error("Failed to toggle wishlist item", err);
      showToast("Unable to update wishlist. Try again.", "error");
    }
  };

  // Extract parameters from URL searchParams
  const category = searchParams.get("category") || undefined;
  const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined;
  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
  const location = searchParams.get("location") || undefined;
  const guests = searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined;
  const checkIn = searchParams.get("check_in") || undefined;
  const checkOut = searchParams.get("check_out") || undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const limit = 12; // Listings page size limit
  
  // Read multi-valued amenities parameters
  const amenities = searchParams.getAll("amenities");

  // Fetch listings from FastAPI whenever filters or page parameters change
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listings.getListings({
        category,
        min_price: minPrice,
        max_price: maxPrice,
        location,
        guests,
        check_in: checkIn,
        check_out: checkOut,
        page,
        limit,
        amenities: amenities.length > 0 ? amenities : undefined,
      });
      setListings(data);
    } catch (err: any) {
      console.error("Failed to load explore listings", err);
      setError(err.message || "Unable to load listings. Make sure the database server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  // Toggle category filters in URL parameters
  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategory = params.get("category");

    if (currentCategory === categoryName) {
      params.delete("category");
    } else {
      params.set("category", categoryName);
    }
    params.set("page", "1"); // Reset pagination

    router.push(`/?${params.toString()}`);
  };

  // Reset all URL search/filter parameters
  const handleResetFilters = () => {
    router.push("/");
  };

  // Pagination page updater
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/?${params.toString()}`);
  };

  // Determine if active parameters are present in URL
  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => key !== "page"
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Category Bar + Filters Toggle */}
      <div className="flex items-center justify-between gap-4 border-b border-border-gray pb-4">
        
        {/* Categories scroll container */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 pr-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`
                  flex flex-col items-center gap-1.5 pb-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                  ${
                    isActive
                      ? "border-dark text-dark"
                      : "border-transparent text-muted hover:text-dark hover:border-border-gray"
                  }
                `}
              >
                <Icon size={20} className="stroke-[1.8]" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Filters Trigger button */}
        <button
          onClick={() => setFilterModalOpen(true)}
          className="flex items-center gap-2 border border-border-gray hover:border-dark transition-all rounded-xl py-3 px-4 text-xs font-bold text-dark cursor-pointer bg-white"
        >
          <SlidersHorizontal size={14} className="stroke-[2.5]" />
          <span>Filters</span>
        </button>

      </div>

      {/* Active Search/Filters Ribbon */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-light-gray/60 px-5 py-3 rounded-2xl border border-border-gray text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-1.5 font-medium text-dark">
            <span className="text-muted">Filtered by:</span>
            {location && <span className="bg-white border border-border-gray px-2 py-0.5 rounded-md">Location: {location}</span>}
            {category && <span className="bg-white border border-border-gray px-2 py-0.5 rounded-md">Category: {category}</span>}
            {guests && <span className="bg-white border border-border-gray px-2 py-0.5 rounded-md">{guests} guests</span>}
            {(minPrice || maxPrice) && (
              <span className="bg-white border border-border-gray px-2 py-0.5 rounded-md">
                Price: ₹{minPrice || 0} - ₹{maxPrice || "any"}
              </span>
            )}
            {amenities.map((am) => (
              <span key={am} className="bg-white border border-border-gray px-2 py-0.5 rounded-md">
                {am}
              </span>
            ))}
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-brand font-bold hover:underline cursor-pointer"
          >
            <RotateCcw size={12} className="stroke-[2.5]" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Listings Display Grid */}
      {loading ? (
        // Render loading skeletons
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ListingSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        // Render error card
        <ErrorState title="Could not retrieve listings" message={error} onRetry={fetchListings} />
      ) : listings.length === 0 ? (
        // Render empty state
        <EmptyState
          title="No listings match your search"
          description="Try broadening your dates, clearing filters, or searching a wider geographic area."
          actionText="Reset search parameters"
          onAction={handleResetFilters}
        />
      ) : (
        // Render active listing cards
        <>
          <div className="flex flex-col md:flex-row gap-6 w-full relative">
            {/* Listings Grid (Left Column) */}
            <div className={`w-full ${showMobileMap ? "hidden md:block" : "block"} md:w-3/5 lg:w-[58%] flex flex-col gap-6`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8 animate-fade-in">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSaved={savedListingIds.includes(listing.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {/* Pagination Navigation Bar */}
              <div className="flex items-center justify-center gap-6 border-t border-border-gray pt-8 mt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 border border-border-gray hover:border-dark hover:bg-light-gray rounded-lg p-2 px-3 text-xs font-semibold text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-xs font-bold text-dark">
                  Page {page}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={listings.length < limit}
                  className="flex items-center gap-1 border border-border-gray hover:border-dark hover:bg-light-gray rounded-lg p-2 px-3 text-xs font-semibold text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Map View (Right Column) */}
            <div className={`w-full ${showMobileMap ? "block" : "hidden md:block"} md:w-2/5 lg:w-[42%] md:sticky md:top-28 h-[400px] md:h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden`}>
              <ListingMap listings={listings} />
            </div>
          </div>

          {/* Floating Mobile Map/List Toggle Button */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-20">
            <button
              onClick={() => setShowMobileMap((prev) => !prev)}
              className="bg-dark hover:bg-dark/95 text-white font-bold py-3 px-5 rounded-full shadow-lg flex items-center gap-2 text-xs tracking-wide hover:scale-105 active:scale-95 transition-all focus:outline-none"
            >
              {showMobileMap ? (
                <>
                  <span>Show list</span>
                  <SlidersHorizontal size={14} />
                </>
              ) : (
                <>
                  <span>Show map</span>
                  <span>🗺️</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Advanced Filter Modal Overlay */}
      <FilterModal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <ExploreContent />
    </Suspense>
  );
}
