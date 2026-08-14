from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from backend.app.database import get_db
from backend.app.models import Booking, Listing, User
from backend.app.schemas import BookingCreate, BookingResponse
from backend.app.auth import get_current_guest, get_current_user

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

# POST /api/bookings - Create a booking (Guest-only)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    current_guest: User = Depends(get_current_guest),
    db: Session = Depends(get_db)
):
    # Acquire a write lock by beginning a transaction immediately (concurrency-safe)
    db.execute(text("BEGIN IMMEDIATE"))
    
    try:
        # 1. Verify listing exists and is active
        listing = db.query(Listing).filter(Listing.id == data.listing_id, Listing.is_active == True).first()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found"
            )
            
        # 2. Verify guest is not the host of the listing
        if current_guest.id == listing.host_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hosts are not allowed to book their own listings"
            )
            
        # 3. Verify check_in < check_out
        if data.check_in >= data.check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-in date must be before check-out date"
            )
            
        # 4. Verify check_in is in the future or today
        if data.check_in < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-in date cannot be in the past"
            )
            
        # 5. Verify passenger count does not exceed listing capacity
        if data.guests_count > listing.guests_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Guest count exceeds listing capacity of {listing.guests_count}"
            )
            
        # 6. Verify date overlap availability (ignore cancelled bookings)
        overlapping_booking = db.query(Booking).filter(
            Booking.listing_id == data.listing_id,
            Booking.status != "cancelled",
            Booking.check_in < data.check_out,
            Booking.check_out > data.check_in
        ).first()
        
        if overlapping_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The requested dates are not available"
            )
            
        # 7. Compute pricing breakdown server-side (do not trust client pricing)
        nights = (data.check_out - data.check_in).days
        subtotal = listing.price_per_night * nights
        cleaning_fee = subtotal * 0.15  # 15% of subtotal
        service_fee = subtotal * 0.10   # 10% of subtotal
        total_price = subtotal + cleaning_fee + service_fee
        
        # 8. Create booking
        new_booking = Booking(
            listing_id=data.listing_id,
            guest_id=current_guest.id,
            check_in=data.check_in,
            check_out=data.check_out,
            guests_count=data.guests_count,
            nightly_price=listing.price_per_night,
            number_of_nights=nights,
            cleaning_fee=cleaning_fee,
            service_fee=service_fee,
            total_price=total_price,
            status="confirmed"
        )
        
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        return new_booking
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database transaction failed: {e}"
        )

# GET /api/bookings/my-trips - Fetch logged-in guest's booking history
@router.get("/my-trips", response_model=List[BookingResponse])
def get_my_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce role guest check if desired, but general logged-in user can check their bookings
    bookings = db.query(Booking).filter(
        Booking.guest_id == current_user.id
    ).order_by(Booking.check_in.desc()).all()
    
    return bookings

# GET /api/bookings/{id} - Get specific booking detail (Authorized for guest or listing host only)
@router.get("/{id}", response_model=BookingResponse)
def get_booking_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
        
    # Enforce that current user is either the guest who booked or the listing owner
    if booking.guest_id != current_user.id and booking.listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking"
        )
        
    return booking

# POST /api/bookings/{id}/cancel - Cancel booking (Authorized for guest or host)
@router.post("/{id}/cancel", response_model=BookingResponse)
def cancel_booking(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
        
    # Enforce cancellation permissions
    if booking.guest_id != current_user.id and booking.listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )
        
    if booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is already cancelled"
        )
        
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking
