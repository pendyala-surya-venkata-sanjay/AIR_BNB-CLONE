"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Listing } from "@/types";

interface ListingMapProps {
  listings: Listing[];
  center?: [number, number];
  zoom?: number;
  singleListing?: boolean;
}

export const ListingMap: React.FC<ListingMapProps> = ({
  listings,
  center,
  zoom = 12,
  singleListing = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter listings that have valid coordinates
  const validListings = listings.filter(
    (l) => l.latitude !== null && l.latitude !== undefined &&
           l.longitude !== null && l.longitude !== undefined
  );

  // Set up Leaflet markers default icon paths
  const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Determine initial center
    let initialCenter: L.LatLngExpression = [20.0, 0.0]; // Default global view
    let initialZoom = 2;

    if (center) {
      initialCenter = center;
      initialZoom = zoom;
    } else if (validListings.length > 0) {
      initialCenter = [validListings[0].latitude!, validListings[0].longitude!];
      initialZoom = zoom;
    }

    // Instantiate map
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Add TileLayer (clean OpenStreetMap styled tile)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Clean up on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when listings change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    validListings.forEach((listing) => {
      const lat = listing.latitude!;
      const lng = listing.longitude!;

      const marker = L.marker([lat, lng]);

      // Renders clean property preview popup on marker click
      const reviewsCount = listing.reviews?.length || 0;
      const avgRating = reviewsCount > 0 && listing.reviews
        ? (listing.reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviewsCount).toFixed(2)
        : "New";

      const imageUrl = listing.images && listing.images.length > 0
        ? listing.images[0].image_url
        : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

      const popupContent = `
        <div style="width: 180px; font-family: system-ui, sans-serif; cursor: pointer;">
          <a href="/listings/${listing.id}" style="text-decoration: none; color: inherit;">
            <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; background-color: #f3f4f6; margin-bottom: 8px;">
              <img src="${imageUrl}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${listing.title}
            </div>
            <div style="font-size: 11px; color: #71717a; margin-bottom: 4px;">
              ${listing.location_city}, ${listing.location_country}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: bold;">
              <span>₹${listing.price_per_night.toLocaleString("en-IN")}<span style="font-weight: normal; font-size: 10px; color: #71717a;">/night</span></span>
              <span style="display: inline-flex; align-items: center; gap: 2px;">
                ★ ${avgRating}
              </span>
            </div>
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 220,
        className: "custom-leaflet-popup",
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have multiple listings on the search page
    if (!singleListing && validListings.length > 0 && map) {
      try {
        const bounds = L.latLngBounds(validListings.map((l) => [l.latitude!, l.longitude!]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.error("Failed to fit map bounds", err);
      }
    } else if (singleListing && validListings.length > 0 && map && center) {
      map.setView(center, zoom);
    }
  }, [listings, center]);

  if (validListings.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] bg-zinc-50 border border-border-gray rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-2">
        <span className="text-sm font-bold text-dark">Location map unavailable</span>
        <span className="text-xs text-muted">Geographic coordinates were not supplied for this stay.</span>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-border-gray z-0 shadow-sm"
    />
  );
};

export default ListingMap;
