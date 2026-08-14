import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, parseISO, startOfToday } from "date-fns";

interface CalendarPickerProps {
  blockedDates: string[]; // List of YYYY-MM-DD strings
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  blockedDates,
  checkIn,
  checkOut,
  onChange,
}) => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  
  // Calculate padding days for the start of the week (Sunday is 0)
  const startDayOfWeek = start.getDay();
  const daysInMonth = eachDayOfInterval({ start, end });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    if (isAfter(startOfMonth(currentMonth), today)) {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const isBlocked = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return blockedDates.includes(formatted);
  };

  const isPast = (date: Date) => {
    return isBefore(date, today);
  };

  const handleDateClick = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");

    if (!checkIn || (checkIn && checkOut)) {
      // First click: select checkIn
      onChange(formatted, "");
    } else {
      // Second click: select checkOut
      const checkInDate = parseISO(checkIn);
      
      if (isBefore(date, checkInDate) || isSameDay(date, checkInDate)) {
        // If second selection is before or same as check-in, set it as check-in instead
        onChange(formatted, "");
      } else {
        // Check if there is any blocked date between check-in and the selected check-out date
        let hasBlockedInRange = false;
        let scanDate = new Date(checkInDate);
        while (isBefore(scanDate, date)) {
          if (isBlocked(scanDate)) {
            hasBlockedInRange = true;
            break;
          }
          scanDate.setDate(scanDate.getDate() + 1);
        }

        if (hasBlockedInRange) {
          alert("Selected range overlaps with an existing booking. Please try other dates.");
          onChange(formatted, "");
        } else {
          onChange(checkIn, formatted);
        }
      }
    }
  };

  const isSelected = (date: Date) => {
    if (checkIn && isSameDay(date, parseISO(checkIn))) return true;
    if (checkOut && isSameDay(date, parseISO(checkOut))) return true;
    return false;
  };

  const isInRange = (date: Date) => {
    if (!checkIn) return false;
    const checkInDate = parseISO(checkIn);

    if (checkOut) {
      const checkOutDate = parseISO(checkOut);
      return isAfter(date, checkInDate) && isBefore(date, checkOutDate);
    }

    if (hoveredDate) {
      return isAfter(date, checkInDate) && isBefore(date, hoveredDate) && isBefore(hoveredDate, date) === false;
    }

    return false;
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Month Navigation Banner */}
      <div className="flex items-center justify-between px-2">
        <h4 className="text-sm font-bold text-dark">
          {format(currentMonth, "MMMM yyyy")}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(today))}
            className="p-1.5 rounded-full border border-border-gray hover:border-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-dark"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-full border border-border-gray hover:border-dark transition-colors cursor-pointer text-dark"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted mb-1">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 justify-items-center text-sm font-medium">
        {/* Padding empty slots */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="w-9 h-9" />
        ))}

        {/* Month Dates */}
        {daysInMonth.map((day) => {
          const disabled = isPast(day) || isBlocked(day);
          const selected = isSelected(day);
          const inRange = isInRange(day);
          const isCheckIn = checkIn && isSameDay(day, parseISO(checkIn));
          const isCheckOut = checkOut && isSameDay(day, parseISO(checkOut));

          return (
            <button
              type="button"
              key={day.toString()}
              onClick={() => !disabled && handleDateClick(day)}
              onMouseEnter={() => !disabled && setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={disabled}
              className={`
                w-9 h-9 flex items-center justify-center rounded-full transition-all relative text-xs
                ${disabled ? "text-zinc-300 line-through cursor-not-allowed" : "text-dark cursor-pointer"}
                ${selected ? "bg-dark text-white font-bold" : ""}
                ${inRange && !selected ? "bg-light-gray font-semibold rounded-none w-full" : ""}
                ${isCheckIn && checkOut ? "rounded-r-none w-full bg-dark text-white" : ""}
                ${isCheckOut && checkIn ? "rounded-l-none w-full bg-dark text-white" : ""}
              `}
            >
              <span className={`relative z-10 ${selected ? "text-white" : ""}`}>
                {format(day, "d")}
              </span>
              {/* Subtle indicators for blocked dates */}
              {isBlocked(day) && (
                <span className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
