from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional

from backend.app.database import get_db
from backend.app.models import Listing, ListingImage, Amenity, User, Booking, Review
from backend.app.schemas import ListingCreate, ListingUpdate, ListingResponse, ReviewCreate, ReviewResponse
from backend.app.auth import get_current_host, get_current_user

router = APIRouter(prefix="/api/listings", tags=["Listings"])

# GET /api/listings - paginated search and filters
@router.get("/", response_model=List[ListingResponse])
def get_listings(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    location: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category: Optional[str] = None,
    amenities: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db)
):
    # Only query active listings
    query = db.query(Listing).filter(Listing.is_active == True)
    
    # 1. Category Filter
    if category:
        query = query.filter(Listing.category == category)
        
    # 2. Price Filters
    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)
        
    # 3. Location Filter (searches city or country, case-insensitive)
    if location:
        search_str = f"%{location}%"
        query = query.filter(
            (Listing.location_city.ilike(search_str)) | 
            (Listing.location_country.ilike(search_str))
        )
        
    # 4. Guest Count Filter
    if guests is not None:
        query = query.filter(Listing.guests_count >= guests)
        
    # 5. Date Availability Filter
    if check_in and check_out:
        if check_in >= check_out:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="check_in date must be before check_out date"
            )
        # Exclude listings that have confirmed bookings overlapping with the range
        query = query.filter(
            ~Listing.bookings.any(
                and_(
                     Booking.status != "cancelled",
                     Booking.check_in < check_out,
                     Booking.check_out > check_in
                )
            )
        )
        
    # 6. Amenities Filter (matches if listing has ALL requested amenities)
    if amenities:
        for am_name in amenities:
            # We filter Listings where there is an association with an Amenity with this name
            query = query.filter(Listing.amenities.any(Amenity.name == am_name))
            
    # Apply Pagination
    offset = (page - 1) * limit
    listings = query.order_by(Listing.created_at.desc()).offset(offset).limit(limit).all()
    
    return listings

# GET /api/listings/{id} - Get detailed listing info
@router.get("/{id}", response_model=ListingResponse)
def get_listing_by_id(id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    return listing

# POST /api/listings - Create listing (Host-only)
@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    data: ListingCreate,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    # Base listing details
    new_listing = Listing(
        host_id=current_host.id,
        title=data.title,
        description=data.description,
        category=data.category,
        price_per_night=data.price_per_night,
        location_city=data.location_city,
        location_country=data.location_country,
        guests_count=data.guests_count,
        bedrooms_count=data.bedrooms_count,
        bathrooms_count=data.bathrooms_count,
        latitude=data.latitude,
        longitude=data.longitude,
        is_active=True
    )
    
    db.add(new_listing)
    db.flush()  # Retrieve listing ID and assign to session context
    
    # Process amenities (Link to existing ones or create new)
    for am_name in data.amenities:
        # Find or create
        amenity = db.query(Amenity).filter_by(name=am_name).first()
        if not amenity:
            amenity = Amenity(name=am_name)
            db.add(amenity)
            db.flush()
        new_listing.amenities.append(amenity)
        
    # Process listing images
    for img_url in data.image_urls:
        image = ListingImage(listing_id=new_listing.id, image_url=img_url)
        db.add(image)
        
    db.commit()
    db.refresh(new_listing)
    return new_listing

# PUT /api/listings/{id} - Edit listing (Host-only, owner verification)
@router.put("/{id}", response_model=ListingResponse)
def update_listing(
    id: int,
    data: ListingUpdate,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
        
    # Enforce Host ownership
    if listing.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this listing"
        )
        
    # Update standard columns
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key not in ["amenities", "image_urls"]:
            setattr(listing, key, value)
            
    # Update amenities if provided
    if data.amenities is not None:
        listing.amenities.clear()
        for am_name in data.amenities:
            amenity = db.query(Amenity).filter_by(name=am_name).first()
            if not amenity:
                amenity = Amenity(name=am_name)
                db.add(amenity)
                db.flush()
            listing.amenities.append(amenity)
            
    # Update image URLs if provided
    if data.image_urls is not None:
        # Delete existing images
        db.query(ListingImage).filter_by(listing_id=listing.id).delete()
        # Add new images
        for img_url in data.image_urls:
            image = ListingImage(listing_id=listing.id, image_url=img_url)
            db.add(image)
            
    db.commit()
    db.refresh(listing)
    return listing

# DELETE /api/listings/{id} - Soft Delete (Host-only, owner verification)
@router.delete("/{id}")
def delete_listing(
    id: int,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
        
    # Enforce Host ownership
    if listing.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this listing"
        )
        
    # Soft delete listing
    listing.is_active = False
    db.commit()
    
    return {"message": "Listing deleted successfully"}

# GET /api/listings/{id}/availability - Date blocking query
@router.get("/{id}/availability")
def get_listing_availability(id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
        
    # Query confirmed bookings that block availability
    bookings = db.query(Booking).filter(
        Booking.listing_id == id,
        Booking.status == "confirmed"
    ).all()
    
    blocked_ranges = [
        {"check_in": b.check_in, "check_out": b.check_out}
        for b in bookings
    ]
    
    return {
        "listing_id": id,
        "blocked_dates": blocked_ranges
    }

# GET /api/listings/{id}/reviews - Get reviews for a listing
@router.get("/{id}/reviews", response_model=List[ReviewResponse])
def get_listing_reviews(id: int, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    reviews = db.query(Review).filter(Review.listing_id == id).order_by(Review.created_at.desc()).all()
    return reviews

# POST /api/listings/{id}/reviews - Submit review (Guest must have booked this listing)
@router.post("/{id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_listing_review(
    id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = db.query(Listing).filter(Listing.id == id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )

    # Verify review eligibility (guest must have booked the listing)
    booking = db.query(Booking).filter(
        Booking.listing_id == id,
        Booking.guest_id == current_user.id,
        Booking.status == "confirmed"
    ).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review listings for which you have a confirmed booking."
        )

    # Check if user has already reviewed
    existing_review = db.query(Review).filter(
        Review.listing_id == id,
        Review.guest_id == current_user.id
    ).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this listing."
        )

    new_review = Review(
        listing_id=id,
        guest_id=current_user.id,
        rating=data.rating,
        comment=data.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review
