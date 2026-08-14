from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from datetime import datetime, date
from typing import List, Optional

# ==========================================
# User / Auth Schemas
# ==========================================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    avatar_url: Optional[str] = None

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., description="Role must be 'guest' or 'host'")
    avatar_url: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v):
        if v not in ["guest", "host"]:
            raise ValueError("Role must be either 'guest' or 'host'")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ==========================================
# Review Schemas
# ==========================================

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=2)

class ReviewResponse(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    guest: UserResponse
    rating: int
    comment: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Listing Schemas
# ==========================================

class ListingImageResponse(BaseModel):
    id: int
    image_url: str

    model_config = ConfigDict(from_attributes=True)

class AmenityResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str
    category: str
    price_per_night: float = Field(..., gt=0)
    location_city: str
    location_country: str
    guests_count: int = Field(..., gt=0)
    bedrooms_count: int = Field(..., ge=0)
    bathrooms_count: float = Field(..., ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: List[str] = []  # List of amenity names to link
    image_urls: List[str] = [] # List of image URLs

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price_per_night: Optional[float] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    guests_count: Optional[int] = None
    bedrooms_count: Optional[int] = None
    bathrooms_count: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None

class ListingResponse(BaseModel):
    id: int
    host_id: int
    host: UserResponse
    title: str
    description: str
    category: str
    price_per_night: float
    location_city: str
    location_country: str
    guests_count: int
    bedrooms_count: int
    bathrooms_count: float
    latitude: Optional[float]
    longitude: Optional[float]
    is_active: bool
    created_at: datetime
    images: List[ListingImageResponse]
    amenities: List[AmenityResponse]
    reviews: List[ReviewResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Booking Schemas
# ==========================================

class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests_count: int = Field(..., gt=0)

class BookingResponse(BaseModel):
    id: int
    listing_id: int
    listing: ListingResponse
    guest_id: int
    guest: UserResponse
    check_in: date
    check_out: date
    guests_count: int
    nightly_price: float
    number_of_nights: int
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Wishlist Schemas
# ==========================================

class WishlistResponse(BaseModel):
    id: int
    user_id: int
    listing_id: int
    listing: ListingResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


