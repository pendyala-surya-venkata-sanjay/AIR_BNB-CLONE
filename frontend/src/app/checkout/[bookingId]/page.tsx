"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, ShieldCheck, CheckCircle2, Calendar, Users, DollarSign, Sparkles, Building } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/context/ToastContext";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function CheckoutPage({ params }: PageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const resolvedParams = use(params);
  const bookingId = Number(resolvedParams.bookingId);

  // States
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // Validation error states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Checkout transaction states
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bookings.getBooking(bookingId);
      setBooking(data);
    } catch (err: any) {
      console.error("Failed to load checkout booking", err);
      setError(err.message || "Failed to retrieve booking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = rawVal.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(rawVal);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
    if (rawVal.length >= 2) {
      setCardExpiry(`${rawVal.substring(0, 2)}/${rawVal.substring(2, 4)}`);
    } else {
      setCardExpiry(rawVal);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!cardName.trim()) {
      errors.cardName = "Cardholder name is required";
    }

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanCard)) {
      errors.cardNumber = "Card number must be exactly 16 digits";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      errors.cardExpiry = "Expiry date must be in MM/YY format";
    } else {
      // Basic past date check
      const [month, year] = cardExpiry.split("/");
      const expDate = new Date(Number(`20${year}`), Number(month) - 1, 1);
      const today = new Date();
      if (expDate < new Date(today.getFullYear(), today.getMonth(), 1)) {
        errors.cardExpiry = "Card has expired";
      }
    }

    if (!/^\d{3,4}$/.test(cardCvv)) {
      errors.cardCvv = "CVV must be 3 or 4 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please check card form error highlights.", "error");
      return;
    }

    setProcessing(true);
    // Simulate transaction delay
    setTimeout(() => {
      setProcessing(false);
      setConfirmed(true);
      showToast("Payment processed successfully! Enjoy your stay.", "success");
    }, 2000);
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (error || !booking) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Booking Not Found"
          message={error || "The checkout session you are trying to access is invalid or expired."}
          onRetry={fetchBooking}
        />
        <div className="text-center mt-6">
          <Link href="/" className="text-brand font-bold hover:underline inline-flex items-center gap-1.5 text-sm">
            <ChevronLeft size={16} />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const { listing } = booking;
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

  // RENDER CONFIRMATION STATE
  if (confirmed) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4 sm:px-6 flex flex-col items-center text-center gap-6 animate-fade-in">
        <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full animate-bounce border border-emerald-100 shadow-xs">
          <CheckCircle2 size={56} className="stroke-[1.8]" />
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full mx-auto">
            <Sparkles size={12} />
            Mock Checkout Completed Successfully
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-dark mt-2">
            Your trip is booked!
          </h1>
          <p className="text-sm text-muted">
            Booking ID Reference: <span className="font-bold text-dark">{booking.id}</span>
          </p>
        </div>

        {/* Confirmation Details Card */}
        <div className="w-full border border-border-gray rounded-2xl overflow-hidden shadow-xs bg-white text-left mt-2">
          <img src={imageUrl} alt={listing.title} className="w-full h-44 object-cover" />
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col">
              <h3 className="font-bold text-dark text-base truncate">{listing.title}</h3>
              <p className="text-xs text-muted mt-0.5">{listing.location_city}, {listing.location_country}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-border-gray pt-4 text-xs font-semibold text-dark">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted" />
                <span>Check-in: {booking.check_in}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted" />
                <span>Checkout: {booking.check_out}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-muted" />
                <span>Guests: {booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-muted" />
                <span>Nights: {booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="border-t border-border-gray pt-4 flex items-center justify-between font-bold text-dark text-base">
              <span>Total Paid (Mock)</span>
              <span>₹{booking.total_price.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 w-full mt-4">
          <Button variant="secondary" onClick={() => router.push("/")} className="py-3 font-semibold">
            Explore Stays
          </Button>
          <Button variant="brand" onClick={() => router.push("/trips")} className="py-3 font-semibold">
            View My Trips
          </Button>
        </div>
      </div>
    );
  }

  // RENDER CHECKOUT PAYMENT FORM
  return (
    <div className="w-full max-w-6xl mx-auto py-2 px-4 sm:px-6">
      
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-dark hover:underline mb-6 cursor-pointer"
      >
        <ChevronLeft size={16} />
        Back to details
      </button>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark mb-8">Confirm and pay</h1>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Mock Payment Info */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Demo disclaimer banner */}
          <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="text-sky-500 shrink-0 mt-0.5" size={20} />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-sky-900 uppercase tracking-wider">Demo / Sandbox Checkout</span>
              <p className="text-sky-700 leading-relaxed">
                This is a mock payment screen. Do NOT enter real credit card details. Any random inputs will complete the booking confirmation flow, and no real transactions will process.
              </p>
            </div>
          </div>

          <form onSubmit={handlePaySubmit} className="flex flex-col gap-5 bg-white border border-border-gray p-6 rounded-2xl shadow-xs">
            <h3 className="text-base font-bold text-dark flex items-center gap-2 border-b border-border-gray pb-3 mb-2">
              <CreditCard size={18} />
              Mock Credit Card Information
            </h3>

            <Input
              type="text"
              label="Cardholder Name"
              placeholder="e.g. Jane Doe"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              error={formErrors.cardName}
              disabled={processing}
              required
            />

            <Input
              type="text"
              label="Card Number"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              maxLength={19}
              error={formErrors.cardNumber}
              disabled={processing}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label="Expiration Date"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={handleExpiryChange}
                maxLength={5}
                error={formErrors.cardExpiry}
                disabled={processing}
                required
              />
              <Input
                type="password"
                label="CVV / CVC"
                placeholder="000"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ""))}
                maxLength={4}
                error={formErrors.cardCvv}
                disabled={processing}
                required
              />
            </div>

            <Button type="submit" variant="brand" fullWidth isLoading={processing} className="mt-4 py-3.5 font-bold text-base shadow-sm">
              Confirm and Pay
            </Button>
          </form>

        </div>

        {/* Right Side: Booking pricing Summary Card */}
        <div className="lg:col-span-5 bg-white border border-border-gray rounded-2xl p-6 shadow-card flex flex-col gap-5 lg:sticky lg:top-28">
          
          {/* Card Header listing info */}
          <div className="flex gap-4 items-start border-b border-border-gray pb-4">
            <img src={imageUrl} alt={listing.title} className="w-24 h-20 object-cover rounded-xl shrink-0" />
            <div className="flex flex-col justify-center min-h-[5rem] overflow-hidden">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{listing.category}</span>
              <h4 className="font-bold text-dark text-sm leading-tight truncate mt-0.5">{listing.title}</h4>
              <p className="text-xs text-muted truncate mt-0.5">{listing.location_city}, {listing.location_country}</p>
            </div>
          </div>

          {/* Booking Parameters details list */}
          <div className="flex flex-col gap-3.5 border-b border-border-gray pb-4 text-xs font-semibold text-dark">
            <h4 className="font-bold text-xs text-dark tracking-wide uppercase">Trip details</h4>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted font-normal">Dates</span>
              <span>{booking.check_in} – {booking.check_out}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted font-normal">Guests</span>
              <span>{booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted font-normal">Stay duration</span>
              <span>{booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Pricing calculations breakdown */}
          <div className="flex flex-col gap-3 text-sm">
            <h4 className="font-bold text-xs text-dark tracking-wide uppercase mb-1">Price details</h4>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted">₹{booking.nightly_price.toLocaleString("en-IN")} x {booking.number_of_nights} nights</span>
              <span>₹{(booking.nightly_price * booking.number_of_nights).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted">Cleaning fee (15%)</span>
              <span>₹{booking.cleaning_fee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted">Service fee (10%)</span>
              <span>₹{booking.service_fee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border-gray pt-3 font-bold text-dark text-base">
              <span>Total Paid (Mock)</span>
              <span>₹{booking.total_price.toLocaleString("en-IN")}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
