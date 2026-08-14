import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, DollarSign, Check } from "lucide-react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_AMENITIES = ["Wi-Fi", "Pool", "Kitchen", "Free parking", "Air conditioning"];

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Pre-populate filters on modal open
  useEffect(() => {
    if (isOpen) {
      setMinPrice(searchParams.get("min_price") || "");
      setMaxPrice(searchParams.get("max_price") || "");
      
      // Read multi-valued amenities params
      const amenities = searchParams.getAll("amenities");
      setSelectedAmenities(amenities);
    }
  }, [isOpen, searchParams]);

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();

    // Maintain search params (like location, check_in, check_out, guests, category)
    searchParams.forEach((value, key) => {
      if (!["min_price", "max_price", "amenities", "page"].includes(key)) {
        params.append(key, value);
      }
    });

    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    
    // Append multiple amenities parameters
    selectedAmenities.forEach((am) => {
      params.append("amenities", am);
    });

    // Reset page to 1
    params.set("page", "1");

    router.push(`/?${params.toString()}`);
    onClose();
  };

  const handleClearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filters" size="md">
      <form onSubmit={handleApply} className="flex flex-col gap-6">
        
        {/* Price Range Section */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-dark">Price range</h4>
          <p className="text-xs text-muted">Nightly prices before fees and taxes</p>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input
              type="number"
              label="Minimum price"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              leadingIcon={<DollarSign size={16} />}
              min="0"
            />
            <Input
              type="number"
              label="Maximum price"
              placeholder="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              leadingIcon={<DollarSign size={16} />}
              min="0"
            />
          </div>
        </div>

        {/* Amenities Checklist Section */}
        <div className="flex flex-col gap-3 border-t border-border-gray pt-4">
          <h4 className="text-sm font-bold text-dark">Amenities</h4>
          <p className="text-xs text-muted">Filter by popular amenities</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const isChecked = selectedAmenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  onClick={() => handleToggleAmenity(amenity)}
                  className={`
                    flex items-center justify-between p-3.5 border rounded-airbnb text-sm transition-all text-left
                    ${
                      isChecked
                        ? "border-dark bg-light-gray font-semibold"
                        : "border-border-gray hover:border-dark"
                    }
                  `}
                >
                  <span className="text-dark">{amenity}</span>
                  <div
                    className={`
                      w-5 h-5 rounded-md border flex items-center justify-center transition-all
                      ${
                        isChecked
                          ? "border-dark bg-dark text-white"
                          : "border-border-gray"
                      }
                    `}
                  >
                    {isChecked && <Check size={12} className="stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border-gray pt-4 mt-2">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm font-semibold text-dark hover:underline underline-offset-4"
          >
            Clear all
          </button>
          <Button type="submit" variant="brand" className="px-6 flex items-center gap-2">
            <Filter size={16} />
            Show Results
          </Button>
        </div>

      </form>
    </Modal>
  );
};
export default FilterModal;
