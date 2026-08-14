"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Calendar, Users, Info, Building, Trash2, ArrowRight, ShieldAlert, Sparkles, Star, Compass } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";

export default function TripsPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();

  // Trips data states
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);

  // Local login form state (for unauthenticated view)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bookings.getMyTrips();
      // Sort bookings: newest first
      data.sort((a, b) => b.id - a.id);
      setTrips(data);
    } catch (err: any) {
      console.error("Failed to load user trips", err);
      setError(err.message || "Failed to fetch booking history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrips();
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
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    setCancelConfirmId(bookingId);
  };

  const executeCancellation = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await api.bookings.cancelBooking(bookingId);
      showToast("Booking cancelled successfully.", "success");
      // Refresh the trips list after successful cancellation to capture the server state
      await fetchTrips();
    } catch (err: any) {
      const errMsg = err.message || "Failed to cancel booking. Please try again later.";
      showToast(errMsg, "error");
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // 1. UNAUTHENTICATED PROMPT STATE (WITH INLINE LOGIN CARD)
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="p-4 bg-light-gray text-muted rounded-full">
            <Plane size={36} className="rotate-45" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-dark">Trips</h1>
          <p className="text-sm text-muted">
            Log in to see your booked trips, check reservation details, and manage upcoming stays.
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

          <p className="text-[10px] text-muted text-center leading-relaxed mt-2">
            Seed accounts: <span className="font-semibold text-dark">john@guest.com</span> / <span className="font-semibold text-dark">password123</span>
          </p>
        </form>
      </div>
    );
  }

  // 2. LOADING STATE
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-4 px-4 flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">Trips</h1>
        <div className="flex flex-col gap-6 animate-pulse mt-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="border border-border-gray rounded-2xl h-44 bg-zinc-50" />
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
          title="Could not load your trips"
          message={error}
          onRetry={fetchTrips}
        />
      </div>
    );
  }

  // 4. EMPTY BOOKING HISTORY STATE
  if (trips.length === 0) {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4">
        <EmptyState
          title="No trips booked... yet!"
          description="Time to dust off your bags and start planning your next getaway. Explore property listings around the world."
          actionText="Explore stays"
          onAction={() => router.push("/")}
        />
      </div>
    );
  }

  // Segmenting Stays
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingTrips = trips.filter(
    (t) => t.status === "confirmed" && t.check_out >= todayStr
  );
  const pastCancelledTrips = trips.filter(
    (t) => t.status === "cancelled" || t.check_out < todayStr
  );

  const renderBookingCard = (booking: Booking, isMuted: boolean) => {
    const { listing } = booking;
    const imageUrl = listing.images && listing.images.length > 0
      ? listing.images[0].image_url
      : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

    const isCancelled = booking.status === "cancelled";
    const isUpcomingActive = booking.status === "confirmed" && booking.check_in >= todayStr;

    return (
      <div
        key={booking.id}
        className={`
          flex flex-col md:flex-row border border-border-gray rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-200
          ${isMuted ? "opacity-75" : ""}
        `}
      >
        {/* Left Side: Thumbnail Image */}
        <div className="w-full md:w-60 h-44 shrink-0 relative bg-zinc-100">
          <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-dark">
            {listing.category}
          </div>
        </div>

        {/* Right Side: Stay Specs & Actions */}
        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <h3 className={`font-bold text-dark text-base truncate ${isCancelled ? "line-through text-muted" : ""}`}>
                {listing.title}
              </h3>
              <p className="text-xs text-muted truncate">
                {listing.location_city}, {listing.location_country}
              </p>
            </div>
            
            {/* Status Badges */}
            <div>
              {isCancelled ? (
                <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-100">
                  Cancelled
                </span>
              ) : booking.check_out < todayStr ? (
                <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-zinc-50 text-zinc-600 border border-zinc-200">
                  Completed
                </span>
              ) : (
                <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confirmed
                </span>
              )}
            </div>
          </div>

          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-dark">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-muted" />
              <span>In: {booking.check_in}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-muted" />
              <span>Out: {booking.check_out}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-muted" />
              <span>{booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building size={13} className="text-muted" />
              <span>{booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Pricing + Action Links footer */}
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between border-t border-border-gray pt-4 gap-3">
            <div className="flex items-baseline gap-1 text-dark text-sm">
              <span className="text-muted font-normal text-xs">Total paid:</span>
              <span className={`font-bold ${isCancelled ? "text-muted" : ""}`}>
                ₹{booking.total_price.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-muted font-normal">
                (Ref ID: #{booking.id})
              </span>
            </div>

            {/* Link Options */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                href={`/listings/${listing.id}`}
                className="text-xs font-bold text-dark hover:underline underline-offset-4"
              >
                View Property
              </Link>
              <span className="text-border-gray text-xs">|</span>
              <Link
                href={`/checkout/${booking.id}`}
                className="text-xs font-bold text-brand hover:underline underline-offset-4"
              >
                Booking Details
              </Link>
              
              {/* Cancellation triggers */}
              {isUpcomingActive && (
                <>
                  <span className="text-border-gray text-xs">|</span>
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-30 cursor-pointer focus:outline-none"
                  >
                    <Trash2 size={13} />
                    <span>{cancellingId === booking.id ? "Cancelling..." : "Cancel Trip"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-4 sm:px-6 flex flex-col gap-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark">Trips</h1>
        <span className="text-xs text-muted font-medium">Logged in as {user.name}</span>
      </div>

      {/* 5. ACTIVE/UPCOMING TRIPS SECTION */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-dark border-b border-border-gray pb-2">Upcoming Trips</h2>
        {upcomingTrips.length === 0 ? (
          <div className="p-8 border border-dashed border-border-gray rounded-2xl text-center bg-zinc-50 flex flex-col items-center gap-3">
            <Compass className="text-muted" size={24} />
            <p className="text-xs text-muted">You have no upcoming confirmed stays booked currently.</p>
            <Link href="/" className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-1 mt-1">
              Explore listings to book a stay
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {upcomingTrips.map((booking) => renderBookingCard(booking, false))}
          </div>
        )}
      </div>

      {/* Past & Cancelled Trips Section */}
      {pastCancelledTrips.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-lg font-bold text-dark border-b border-border-gray pb-2">Past & Cancelled stays</h2>
          <div className="flex flex-col gap-6">
            {pastCancelledTrips.map((booking) => renderBookingCard(booking, true))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Custom Modal */}
      <Modal
        isOpen={cancelConfirmId !== null}
        onClose={() => setCancelConfirmId(null)}
        title="Cancel this reservation?"
        size="sm"
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-sm leading-relaxed text-muted">
            This action will cancel your booking and release the reserved dates. Are you sure you want to proceed?
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setCancelConfirmId(null)}
            >
              Keep reservation
            </Button>
            <Button
              variant="brand"
              fullWidth
              onClick={async () => {
                const id = cancelConfirmId;
                setCancelConfirmId(null);
                if (id !== null) {
                  await executeCancellation(id);
                }
              }}
            >
              Cancel reservation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
