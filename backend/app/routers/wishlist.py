from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.app.database import get_db
from backend.app.models import Wishlist, Listing, User
from backend.app.schemas import WishlistResponse
from backend.app.auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

# GET /api/wishlist - Retrieve user's wishlist
@router.get("/", response_model=List[WishlistResponse])
def get_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).order_by(Wishlist.created_at.desc()).all()
    
    return wishlist

# POST /api/wishlist/{listing_id} - Add listing to user's wishlist
@router.post("/{listing_id}", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify listing exists and is active
    listing = db.query(Listing).filter(Listing.id == listing_id, Listing.is_active == True).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
        
    # Check if already in wishlist
    existing_wishlist = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.listing_id == listing_id
    ).first()
    
    if existing_wishlist:
        return existing_wishlist
        
    new_wish = Wishlist(
        user_id=current_user.id,
        listing_id=listing_id
    )
    
    db.add(new_wish)
    db.commit()
    db.refresh(new_wish)
    return new_wish

# DELETE /api/wishlist/{listing_id} - Remove listing from user's wishlist
@router.delete("/{listing_id}")
def remove_from_wishlist(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wish = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.listing_id == listing_id
    ).first()
    
    if not wish:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist entry not found"
        )
        
    db.delete(wish)
    db.commit()
    return {"message": "Listing removed from wishlist successfully"}
