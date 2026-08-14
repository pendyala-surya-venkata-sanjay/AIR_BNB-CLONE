import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app import models
from backend.app.auth import create_access_token, hash_password

# Setup an isolated test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database session fixture
@pytest.fixture(name="session")
def session_fixture():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

# FastAPI TestClient fixture
@pytest.fixture(name="client")
def client_fixture(session):
    def override_get_db():
        try:
            yield session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.pop(get_db, None)

# Seeding fixture for tests
@pytest.fixture(name="seed_data")
def seed_data_fixture(session):
    # Hash password once
    pw = hash_password("password123")
    
    # Create Users
    host_sarah = models.User(name="Sarah Host", email="sarah@host.com", hashed_password=pw, role="host")
    host_michael = models.User(name="Michael Host", email="michael@host.com", hashed_password=pw, role="host")
    guest_john = models.User(name="John Guest", email="john@guest.com", hashed_password=pw, role="guest")
    guest_emily = models.User(name="Emily Guest", email="emily@guest.com", hashed_password=pw, role="guest")
    
    session.add_all([host_sarah, host_michael, guest_john, guest_emily])
    session.commit()
    
    # Create Amenity
    wifi = models.Amenity(name="Wi-Fi")
    pool = models.Amenity(name="Pool")
    session.add_all([wifi, pool])
    session.commit()
    
    # Create Listing
    listing = models.Listing(
        host_id=host_sarah.id,
        title="Sarah's Malibu Villa",
        description="Beach views",
        category="Beachfront",
        price_per_night=200.0,
        location_city="Malibu",
        location_country="USA",
        guests_count=4,
        bedrooms_count=2,
        bathrooms_count=2.0,
        is_active=True
    )
    listing.amenities.append(wifi)
    listing.amenities.append(pool)
    session.add(listing)
    session.commit()
    
    # Create Listing Image
    img = models.ListingImage(listing_id=listing.id, image_url="http://pics.com/1.jpg")
    session.add(img)
    session.commit()
    
    # Create Booking (Sep 1 -> Sep 5)
    booking = models.Booking(
        listing_id=listing.id,
        guest_id=guest_john.id,
        check_in=date(2026, 9, 1),
        check_out=date(2026, 9, 5),
        guests_count=2,
        nightly_price=200.0,
        number_of_nights=4,
        cleaning_fee=120.0,
        service_fee=80.0,
        total_price=1000.0,
        status="confirmed"
    )
    session.add(booking)
    session.commit()
    
    return {
        "host_sarah": host_sarah,
        "host_michael": host_michael,
        "guest_john": guest_john,
        "guest_emily": guest_emily,
        "listing": listing,
        "booking": booking
    }

# =====================================================================
# AUTHENTICATION TESTS
# =====================================================================

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "New Guest", "email": "new@guest.com", "password": "password123", "role": "guest"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "new@guest.com"

def test_register_invalid_role(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Admin", "email": "admin@test.com", "password": "password123", "role": "admin"}
    )
    assert response.status_code == 422

def test_login_success(client, seed_data):
    response = client.post(
        "/api/auth/login",
        json={"email": "john@guest.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_password(client, seed_data):
    response = client.post(
        "/api/auth/login",
        json={"email": "john@guest.com", "password": "wrong_password"}
    )
    assert response.status_code == 401

def test_get_me_protected(client, seed_data):
    token = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["email"] == "john@guest.com"

# =====================================================================
# LISTINGS TESTS & AUTHORIZATION
# =====================================================================

def test_get_listings_pagination(client, seed_data):
    response = client.get("/api/listings/?page=1&limit=10")
    assert response.status_code == 200
    assert len(response.json()) == 1

def test_create_listing_authorization(client, seed_data):
    # Guest cannot create listing (403)
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    response = client.post(
        "/api/listings/",
        json={
            "title": "Cabin", "description": "Lakeside", "category": "Cabins",
            "price_per_night": 150.0, "location_city": "Aspen", "location_country": "USA",
            "guests_count": 2, "bedrooms_count": 1, "bathrooms_count": 1.0,
            "amenities": ["Wi-Fi"], "image_urls": ["http://img.jpg"]
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 403

    # Host can create listing (201)
    token_host = create_access_token(data={"sub": str(seed_data["host_sarah"].id)})
    response2 = client.post(
        "/api/listings/",
        json={
            "title": "Cabin", "description": "Lakeside", "category": "Cabins",
            "price_per_night": 150.0, "location_city": "Aspen", "location_country": "USA",
            "guests_count": 2, "bedrooms_count": 1, "bathrooms_count": 1.0,
            "amenities": ["Wi-Fi"], "image_urls": ["http://img.jpg"]
        },
        headers={"Authorization": f"Bearer {token_host}"}
    )
    assert response2.status_code == 201

def test_update_listing_owner_only(client, seed_data):
    token_owner = create_access_token(data={"sub": str(seed_data["host_sarah"].id)})
    token_other = create_access_token(data={"sub": str(seed_data["host_michael"].id)})
    listing_id = seed_data["listing"].id
    
    # Michael tries to edit Sarah's listing (403)
    response = client.put(
        f"/api/listings/{listing_id}",
        json={"price_per_night": 500.0},
        headers={"Authorization": f"Bearer {token_other}"}
    )
    assert response.status_code == 403
    
    # Sarah edits her own listing (200)
    response2 = client.put(
        f"/api/listings/{listing_id}",
        json={"price_per_night": 500.0},
        headers={"Authorization": f"Bearer {token_owner}"}
    )
    assert response2.status_code == 200
    assert response2.json()["price_per_night"] == 500.0

def test_soft_delete_listing(client, seed_data):
    token_owner = create_access_token(data={"sub": str(seed_data["host_sarah"].id)})
    listing_id = seed_data["listing"].id
    
    response = client.delete(
        f"/api/listings/{listing_id}",
        headers={"Authorization": f"Bearer {token_owner}"}
    )
    assert response.status_code == 200
    
    # Details should now return 404
    response_get = client.get(f"/api/listings/{listing_id}")
    assert response_get.status_code == 404

# =====================================================================
# BOOKINGS & OVERLAP TESTS
# =====================================================================

def test_create_booking_valid(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_emily"].id)})
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": seed_data["listing"].id,
            "check_in": "2026-10-01",
            "check_out": "2026-10-05",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 201
    
    # Check pricing calculation
    # 4 nights * 200 = 800 subtotal
    # cleaning = 800 * 0.15 = 120
    # service = 800 * 0.10 = 80
    # total = 800 + 120 + 80 = 1000
    data = response.json()
    assert data["number_of_nights"] == 4
    assert data["nightly_price"] == 200.0
    assert data["cleaning_fee"] == 120.0
    assert data["service_fee"] == 80.0
    assert data["total_price"] == 1000.0

def test_booking_overlap_rejection(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_emily"].id)})
    listing_id = seed_data["listing"].id
    
    # Try to book Sep 2 -> Sep 4 (fully overlaps Booking 1 Sep 1->5)
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": listing_id,
            "check_in": "2026-09-02",
            "check_out": "2026-09-04",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 400

def test_booking_adjacent_allowed(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_emily"].id)})
    listing_id = seed_data["listing"].id
    
    # Book Sep 5 -> Sep 10 (starts exactly when Booking 1 ends)
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": listing_id,
            "check_in": "2026-09-05",
            "check_out": "2026-09-10",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 201

def test_booking_cancelled_releases_dates(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    token_guest2 = create_access_token(data={"sub": str(seed_data["guest_emily"].id)})
    listing_id = seed_data["listing"].id
    
    # Create booking for Nov 1 -> Nov 5
    res_create = client.post(
        "/api/bookings/",
        json={
            "listing_id": listing_id,
            "check_in": "2026-11-01",
            "check_out": "2026-11-05",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert res_create.status_code == 201
    booking_id = res_create.json()["id"]
    
    # Cancel it
    res_cancel = client.post(
        f"/api/bookings/{booking_id}/cancel",
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert res_cancel.status_code == 200
    
    # Rebook same dates (should be allowed now)
    res_rebook = client.post(
        "/api/bookings/",
        json={
            "listing_id": listing_id,
            "check_in": "2026-11-01",
            "check_out": "2026-11-05",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest2}"}
    )
    assert res_rebook.status_code == 201

def test_booking_invalid_dates(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": seed_data["listing"].id,
            "check_in": "2026-12-05",
            "check_out": "2026-12-02",  # Check_in after check_out
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 400

def test_booking_capacity_exceeded(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": seed_data["listing"].id,
            "check_in": "2026-12-05",
            "check_out": "2026-12-10",
            "guests_count": 5  # Capacity is 4
        },
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 400

def test_host_booking_own_listing_disallowed(client, seed_data):
    token_host = create_access_token(data={"sub": str(seed_data["host_sarah"].id)})
    
    response = client.post(
        "/api/bookings/",
        json={
            "listing_id": seed_data["listing"].id,
            "check_in": "2026-12-05",
            "check_out": "2026-12-10",
            "guests_count": 2
        },
        headers={"Authorization": f"Bearer {token_host}"}
    )
    assert response.status_code == 400 or response.status_code == 403

def test_wishlist_endpoints(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    listing_id = seed_data["listing"].id
    
    # 1. Add to wishlist
    response = client.post(
        f"/api/wishlist/{listing_id}",
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 201
    
    # 2. Get wishlist
    response = client.get(
        "/api/wishlist/",
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["listing_id"] == listing_id

    # 3. Remove from wishlist
    response = client.delete(
        f"/api/wishlist/{listing_id}",
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 200

    # 4. Get wishlist again (should be empty)
    response = client.get(
        "/api/wishlist/",
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_reviews_endpoints(client, seed_data):
    token_guest = create_access_token(data={"sub": str(seed_data["guest_john"].id)})
    token_guest_no_booking = create_access_token(data={"sub": str(seed_data["guest_emily"].id)})
    listing_id = seed_data["listing"].id

    # 1. Emily (no booking) tries to review -> Forbidden (403)
    response = client.post(
        f"/api/listings/{listing_id}/reviews",
        json={"rating": 5, "comment": "Amazing!"},
        headers={"Authorization": f"Bearer {token_guest_no_booking}"}
    )
    assert response.status_code == 403

    # 2. John (has booking) reviews -> Success (201)
    response = client.post(
        f"/api/listings/{listing_id}/reviews",
        json={"rating": 5, "comment": "Truly awesome villa!"},
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 201

    # 3. John tries to review again -> Bad Request (400)
    response = client.post(
        f"/api/listings/{listing_id}/reviews",
        json={"rating": 4, "comment": "Another comment"},
        headers={"Authorization": f"Bearer {token_guest}"}
    )
    assert response.status_code == 400

    # 4. Get reviews list
    response = client.get(f"/api/listings/{listing_id}/reviews")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["comment"] == "Truly awesome villa!"
    assert response.json()[0]["rating"] == 5
