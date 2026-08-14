"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building, Calendar, Users, DollarSign, Star, UserX, AlertTriangle, ShieldCheck, Tag, Ban, Edit, Settings, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Listing, Booking } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Selected tab
  const [activeTab, setActiveTab] = useState<"listings" | "bookings">("listings");

  // Host data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deactivation state
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<number | null>(null);

  const fetchHostData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, bookingsData] = await Promise.all([
        api.host.getListings(),
        api.host.getBookings(),
      ]);
      setListings(listingsData);
      setBookings(bookingsData);
    } catch (err: any) {
      console.error("Failed to load host dashboard details", err);
      setError(err.message || "Failed to retrieve host information from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "host") {
      fetchHostData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDeactivateListing = (listingId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeactivateConfirmId(listingId);
  };

  const executeDeactivation = async (listingId: number) => {
    setDeactivatingId(listingId);
    try {
      await api.listings.deleteListing(listingId);
      showToast("Listing deactivated successfully.", "success");
      // Refresh listing state to update active/inactive indicator
      await fetchHostData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to deactivate listing. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setDeactivatingId(null);
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // 1. UNAUTHORIZED / NON-HOST ROLE STATE
  if (!user || user.role !== "host") {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 flex flex-col items-center text-center gap-6">
        <div className="p-4 bg-red-50 text-red-500 rounded-full border border-red-100 shadow-xs">
          <ShieldCheck size={44} className="stroke-[1.8] text-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-dark">Host Access Required</h1>
          <p className="text-sm text-muted max-w-md">
            This workspace section is restricted to hosts only. If you own properties and want to host stays, please log in with a Host account.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
          <Button variant="secondary" onClick={() => router.push("/")} className="py-2.5 px-6 font-semibold">
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  // 2. LOADING STATE
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-4 px-4 flex flex-col gap-8">
        <div className="h-10 bg-zinc-200 rounded-lg w-1/4 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-44 bg-zinc-50 border border-border-gray rounded-2xl animate-pulse mt-4" />
      </div>
    );
  }

  // 3. ERROR STATE
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto py-12">
        <ErrorState
          title="Could not load host dashboard"
          message={error}
          onRetry={fetchHostData}
        />
      </div>
    );
  }

  const activeListingsCount = listings.filter((l) => l.is_active).length;

  return (
    <div className="w-full max-w-7xl mx-auto py-2 px-4 sm:px-6 flex flex-col gap-8">
      
      {/* Dashboard Stats Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-gray pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark">Host Dashboard</h1>
          <p className="text-xs text-muted">Welcome back, {user.name} · Managing your properties</p>
        </div>
        
        <Link href="/host/listings/new">
          <Button variant="brand" className="py-2.5 px-5 font-bold flex items-center gap-1.5 shadow-sm text-xs">
            <Plus size={16} className="stroke-[3]" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Grid Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 border border-border-gray rounded-2xl bg-white shadow-xs">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Listings</span>
          <p className="text-2xl font-bold text-dark mt-1">{listings.length}</p>
        </div>
        <div className="p-5 border border-border-gray rounded-2xl bg-white shadow-xs">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Active Listings</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeListingsCount}</p>
        </div>
        <div className="p-5 border border-border-gray rounded-2xl bg-white shadow-xs">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Guest Bookings</span>
          <p className="text-2xl font-bold text-dark mt-1">{bookings.length}</p>
        </div>
        <div className="p-5 border border-border-gray rounded-2xl bg-white shadow-xs">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Est. Revenue</span>
          <p className="text-2xl font-bold text-dark mt-1">
            ₹{bookings.reduce((sum, b) => b.status === "confirmed" ? sum + b.total_price : sum, 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex items-center gap-6 border-b border-border-gray pb-0.5">
        <button
          onClick={() => setActiveTab("listings")}
          className={`
            pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer
            ${
              activeTab === "listings"
                ? "border-dark text-dark"
                : "border-transparent text-muted hover:text-dark"
            }
          `}
        >
          My Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`
            pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer
            ${
              activeTab === "bookings"
                ? "border-dark text-dark"
                : "border-transparent text-muted hover:text-dark"
            }
          `}
        >
          Guest Reservations ({bookings.length})
        </button>
      </div>

      {/* 4. ACTIVE TAB CONTENT SECTION */}
      {activeTab === "listings" ? (
        
        // --- TABS VIEW 1: MY LISTINGS ---
        listings.length === 0 ? (
          <EmptyState
            title="Create your first listing!"
            description="Expose your cabins or villas to guests worldwide. Start hosting today."
            actionText="Create Listing"
            onAction={() => router.push("/host/listings/new")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const imageUrl = listing.images && listing.images.length > 0
                ? listing.images[0].image_url
                : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

              return (
                <div key={listing.id} className="border border-border-gray rounded-2xl overflow-hidden shadow-xs bg-white flex flex-col justify-between">
                  <div className="relative h-44 bg-zinc-100">
                    <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                    
                    {/* Status Badge indicator */}
                    <div className="absolute top-3 left-3">
                      {listing.is_active ? (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-red-100 text-red-800 border border-red-200">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-dark shadow-xs">
                      {listing.category}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-dark text-base truncate">{listing.title}</h4>
                      <p className="text-xs text-muted truncate">{listing.location_city}, {listing.location_country}</p>
                      <p className="text-xs text-muted mt-1 font-medium">
                        Capacity: {listing.guests_count} guest{listing.guests_count !== 1 ? "s" : ""} · {listing.bedrooms_count} Bed{listing.bedrooms_count !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-bold text-dark mt-2">
                        ₹{listing.price_per_night.toLocaleString("en-IN")} <span className="font-normal text-xs text-muted">/ night</span>
                      </p>
                    </div>

                    {/* Roster Actions */}
                    <div className="border-t border-border-gray pt-4 flex items-center justify-between gap-3">
                      <Link href={`/host/listings/${listing.id}/edit`} className="flex-1">
                        <Button variant="secondary" fullWidth className="py-2 flex items-center justify-center gap-1 text-xs">
                          <Edit size={12} />
                          Edit
                        </Button>
                      </Link>
                      
                      {listing.is_active && (
                        <Button
                          variant="outline"
                          onClick={(e) => handleDeactivateListing(listing.id, e)}
                          isLoading={deactivatingId === listing.id}
                          className="flex-1 py-2 flex items-center justify-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs cursor-pointer"
                        >
                          <Ban size={12} />
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        
        // --- TABS VIEW 2: GUEST RESERVATIONS ---
        bookings.length === 0 ? (
          <div className="p-12 border border-dashed border-border-gray rounded-2xl text-center bg-zinc-50 flex flex-col items-center gap-3 max-w-md mx-auto">
            <Calendar className="text-muted" size={32} />
            <h4 className="font-bold text-dark text-sm">No reservations yet</h4>
            <p className="text-xs text-muted">When a guest books one of your listings, details will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => {
              const isCancelled = booking.status === "cancelled";
              return (
                <div
                  key={booking.id}
                  className={`
                    border border-border-gray rounded-2xl p-5 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-xs transition-shadow
                    ${isCancelled ? "opacity-75 bg-zinc-50/50" : ""}
                  `}
                >
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-brand uppercase tracking-wider">#{booking.id} Reference</span>
                      {isCancelled ? (
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-red-50 text-red-700 border border-red-100">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-bold text-dark text-sm truncate">{booking.listing.title}</h4>
                    
                    <div className="flex items-center gap-4 text-xs text-muted mt-1 flex-wrap">
                      <span>Guest: <strong className="text-dark">{booking.guest?.name || "Guest User"}</strong></span>
                      <span>Dates: <strong className="text-dark">{booking.check_in} to {booking.check_out}</strong></span>
                      <span>Nights: <strong className="text-dark">{booking.number_of_nights}</strong></span>
                      <span>Guests: <strong className="text-dark">{booking.guests_count}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-border-gray pt-3 md:pt-0">
                    <div className="flex flex-col text-left md:text-right">
                      <span className="text-[10px] text-muted uppercase font-bold">Total earnings</span>
                      <span className={`text-base font-bold text-dark ${isCancelled ? "text-muted line-through" : ""}`}>
                        ₹{booking.total_price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    
                    <Link href={`/checkout/${booking.id}`}>
                      <button className="flex items-center gap-1 text-xs font-bold text-dark hover:underline underline-offset-4 cursor-pointer focus:outline-none">
                        View Details
                        <ChevronRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Listing Deactivation Custom Modal */}
      <Modal
        isOpen={deactivateConfirmId !== null}
        onClose={() => setDeactivateConfirmId(null)}
        title="Deactivate this listing?"
        size="sm"
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-sm leading-relaxed text-muted">
            Are you sure you want to deactivate this listing? It will no longer appear in Explore search results, but historical reservation logs will remain intact.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeactivateConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              fullWidth
              onClick={async () => {
                const id = deactivateConfirmId;
                setDeactivateConfirmId(null);
                if (id !== null) {
                  await executeDeactivation(id);
                }
              }}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
