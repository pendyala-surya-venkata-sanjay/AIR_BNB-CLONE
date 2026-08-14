from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, ForeignKey, UniqueConstraint, Table, Boolean, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

# Association Table for Many-to-Many relationship between Listings and Amenities
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", Integer, ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", Integer, ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Enforced to be "guest" or "host"
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Database-level constraints
    __table_args__ = (
        CheckConstraint("role IN ('guest', 'host')", name="chk_user_role"),
    )

    # Relationships
    listings = relationship("Listing", back_populates="host", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guest", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="guest", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # e.g. "Beachfront", "Cabins"
    price_per_night = Column(Float, nullable=False)
    location_city = Column(String, nullable=False)
    location_country = Column(String, nullable=False)
    guests_count = Column(Integer, nullable=False)
    bedrooms_count = Column(Integer, nullable=False)
    bathrooms_count = Column(Float, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)  # Soft delete
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    host = relationship("User", back_populates="listings")
    images = relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan")
    amenities = relationship("Amenity", secondary=listing_amenities, back_populates="listings")
    bookings = relationship("Booking", back_populates="listing")  # Preserved historically
    reviews = relationship("Review", back_populates="listing")    # Preserved historically
    wishlists = relationship("Wishlist", back_populates="listing", cascade="all, delete-orphan")



class ListingImage(Base):
    __tablename__ = "listing_images"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)

    # Relationships
    listing = relationship("Listing", back_populates="images")


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    # Relationships
    listings = relationship("Listing", secondary=listing_amenities, back_populates="amenities")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests_count = Column(Integer, nullable=False)
    nightly_price = Column(Float, nullable=False)
    number_of_nights = Column(Integer, nullable=False)
    cleaning_fee = Column(Float, nullable=False)
    service_fee = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="confirmed")  # "confirmed" or "cancelled"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User", back_populates="bookings")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="RESTRICT"), nullable=False)
    guest_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Database-level constraints
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating"),
    )

    # Relationships
    listing = relationship("Listing", back_populates="reviews")
    guest = relationship("User", back_populates="reviews")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="wishlists")
    listing = relationship("Listing", back_populates="wishlists")

    # Compound Unique Constraint: A user can save a listing to their wishlist only once
    __table_args__ = (
        UniqueConstraint("user_id", "listing_id", name="uq_user_listing_wishlist"),
    )
