from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models import Listing, Booking, User
from backend.app.schemas import ListingResponse, BookingResponse
from backend.app.auth import get_current_host

router = APIRouter(prefix="/api/host", tags=["Host Dashboard"])

# GET /api/host/listings - Get listings owned by current host
@router.get("/listings", response_model=List[ListingResponse])
def get_host_listings(
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    listings = db.query(Listing).filter(
        Listing.host_id == current_host.id,
        Listing.is_active == True
    ).order_by(Listing.created_at.desc()).all()
    
    return listings

# GET /api/host/bookings - Get guest bookings for listings owned by host
@router.get("/bookings", response_model=List[BookingResponse])
def get_host_bookings(
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    # Join Bookings on Listings and filter where listing.host_id is current host
    bookings = db.query(Booking).join(Listing).filter(
        Listing.host_id == current_host.id
    ).order_by(Booking.check_in.desc()).all()
    
    return bookings
