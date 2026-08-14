"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Image as ImageIcon, MapPin, Building, DollarSign, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { useToast } from "@/context/ToastContext";

const CATEGORIES = ["Beachfront", "Cabins", "Lofts", "Townhouses", "Mansions", "Domes"];
const AVAILABLE_AMENITIES = ["Wi-Fi", "Pool", "Kitchen", "Free parking", "Air conditioning"];

export default function NewListingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Beachfront");
  const [pricePerNight, setPricePerNight] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [guestsCount, setGuestsCount] = useState("2");
  const [bedroomsCount, setBedroomsCount] = useState("1");
  const [bathroomsCount, setBathroomsCount] = useState("1");
  
  // Image URLs - prefilled with a nice placeholder to make manual testing super fast
  const [imageUrlsText, setImageUrlsText] = useState(
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80\n" +
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80"
  );

  // Amenities state
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Page loader and errors
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      setError("Title must be at least 3 characters long");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Parse image URLs
    const urls = imageUrlsText
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    try {
      await api.listings.createListing({
        title,
        description,
        category,
        price_per_night: Number(pricePerNight),
        location_city: city,
        location_country: country,
        guests_count: Number(guestsCount),
        bedrooms_count: Number(bedroomsCount),
        bathrooms_count: Number(bathroomsCount),
        amenities: selectedAmenities,
        image_urls: urls,
      });

      showToast("Property listing created successfully!", "success");
      router.push("/host");
    } catch (err: any) {
      console.error("Failed to create property", err);
      const errMsg = err.message || "Failed to create listing. Please check input parameters.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // Role checking lock
  if (!user || user.role !== "host") {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center flex flex-col gap-4">
        <h1 className="text-xl font-bold text-dark">Access Denied</h1>
        <p className="text-sm text-muted">Please sign in as a host to upload property listings.</p>
        <Button variant="brand" onClick={() => router.push("/")} className="py-2 mt-2">
          Back to Explore
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-2 px-4 sm:px-6">
      
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-dark hover:underline mb-6 cursor-pointer"
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </button>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-dark mb-8">Create new listing</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-sm text-red-600 rounded-xl font-medium mb-6 animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white border border-border-gray p-6 rounded-2xl shadow-xs">
        
        {/* Core Description fields */}
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-2 mb-1 flex items-center gap-2">
            <Building size={18} />
            Property Details
          </h3>

          <Input
            type="text"
            label="Listing Title"
            placeholder="e.g. Scenic Oceanfront Malibu Villa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-dark uppercase tracking-wider">Property Description</label>
            <textarea
              placeholder="Provide a detailed description of the space, views, access details, and local amenities..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="w-full border border-border-gray focus:border-dark rounded-xl p-3.5 text-sm transition-all focus:outline-none bg-white text-dark min-h-[6rem] leading-relaxed resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-dark uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="w-full border border-border-gray focus:border-dark rounded-xl p-3.5 text-sm transition-all focus:outline-none bg-white text-dark h-[46px] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              label="Nightly Price (INR)"
              placeholder="25000"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              leadingIcon={<DollarSign size={16} />}
              min="1"
              disabled={submitting}
              required
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-2 mb-1 flex items-center gap-2">
            <MapPin size={18} />
            Location Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="text"
              label="City"
              placeholder="Malibu"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={submitting}
              required
            />
            <Input
              type="text"
              label="Country"
              placeholder="United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        {/* Capacity specifications */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-2 mb-1 flex items-center gap-2">
            <Users size={18} />
            Capacity & Room specs
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              label="Max guests"
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              min="1"
              disabled={submitting}
              required
            />
            <Input
              type="number"
              label="Bedrooms count"
              value={bedroomsCount}
              onChange={(e) => setBedroomsCount(e.target.value)}
              min="0"
              disabled={submitting}
              required
            />
            <Input
              type="number"
              label="Bathrooms count"
              value={bathroomsCount}
              onChange={(e) => setBathroomsCount(e.target.value)}
              min="0"
              step="0.5"
              disabled={submitting}
              required
            />
          </div>
        </div>

        {/* Image URLs text section */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-2 mb-1 flex items-center gap-2">
            <ImageIcon size={18} />
            Property Images
          </h3>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-dark uppercase tracking-wider">Image URLs (one URL per line)</label>
            <textarea
              placeholder="Paste public image link URLs, one per line..."
              rows={3}
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
              disabled={submitting}
              className="w-full border border-border-gray focus:border-dark rounded-xl p-3.5 text-sm transition-all focus:outline-none bg-white text-dark min-h-[5rem] leading-relaxed resize-y font-mono"
              required
            />
            <span className="text-[10px] text-muted -mt-0.5">Please provide valid HTTP/HTTPS URLs.</span>
          </div>
        </div>

        {/* Amenities checklist */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-dark text-base border-b border-border-gray pb-2 mb-1">
            Amenities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleToggleAmenity(amenity)}
                  disabled={submitting}
                  className={`
                    flex items-center gap-2.5 p-3 border rounded-xl text-xs font-semibold transition-all text-left cursor-pointer
                    ${
                      isChecked
                        ? "border-dark bg-light-gray/60 text-dark"
                        : "border-border-gray hover:border-dark text-muted hover:text-dark"
                    }
                  `}
                >
                  <div
                    className={`
                      w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0
                      ${
                        isChecked
                          ? "border-dark bg-dark text-white"
                          : "border-border-gray bg-white"
                      }
                    `}
                  >
                    {isChecked && <span className="text-[9px] font-bold">✓</span>}
                  </div>
                  <span>{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 border-t border-border-gray pt-6 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/host")}
            disabled={submitting}
            className="px-6 font-semibold"
          >
            Cancel
          </Button>
          <Button type="submit" variant="brand" isLoading={submitting} className="px-6 font-semibold shadow-xs">
            Create Listing
          </Button>
        </div>

      </form>
    </div>
  );
}
