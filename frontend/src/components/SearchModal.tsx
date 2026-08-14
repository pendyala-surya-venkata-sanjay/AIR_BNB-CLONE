import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Calendar, Users, Plus, Minus } from "lucide-react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  // Sync state with URL params on open
  useEffect(() => {
    if (isOpen) {
      setLocation(searchParams.get("location") || "");
      setCheckIn(searchParams.get("check_in") || "");
      setCheckOut(searchParams.get("check_out") || "");
      setGuests(Number(searchParams.get("guests")) || 1);
    }
  }, [isOpen, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    // Maintain existing filter parameters (like category, min_price, max_price, amenities)
    searchParams.forEach((value, key) => {
      if (!["location", "check_in", "check_out", "guests", "page"].includes(key)) {
        params.append(key, value);
      }
    });

    if (location) params.set("location", location);
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests > 1) params.set("guests", String(guests));
    
    // Reset page to 1 on new search
    params.set("page", "1");

    router.push(`/?${params.toString()}`);
    onClose();
  };

  const handleClear = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search stays" size="md">
      <form onSubmit={handleSearch} className="flex flex-col gap-6">
        
        {/* Destination Location */}
        <div className="flex flex-col gap-2">
          <Input
            type="text"
            label="Where to?"
            placeholder="Search destinations (e.g. Italy, Aspen, Kyoto)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leadingIcon={<MapPin size={18} />}
          />
        </div>

        {/* Date Selections */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Check in"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            leadingIcon={<Calendar size={18} />}
            min={new Date().toISOString().split("T")[0]}
          />
          <Input
            type="date"
            label="Check out"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            leadingIcon={<Calendar size={18} />}
            min={checkIn || new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Guest Size Selector */}
        <div className="flex items-center justify-between border-t border-border-gray pt-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-dark flex items-center gap-2">
              <Users size={16} />
              Guests capacity
            </span>
            <span className="text-xs text-muted">Number of adults, children, and infants</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center text-dark hover:border-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-semibold w-4 text-center">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(16, g + 1))}
              disabled={guests >= 16}
              className="w-8 h-8 rounded-full border border-border-gray flex items-center justify-center text-dark hover:border-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border-gray pt-4 mt-2">
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-semibold text-dark hover:underline underline-offset-4"
          >
            Clear all
          </button>
          <Button type="submit" variant="brand" className="px-6 flex items-center gap-2">
            <Search size={16} className="stroke-[2.5]" />
            Search Stays
          </Button>
        </div>

      </form>
    </Modal>
  );
};
export default SearchModal;
