import sys
import os
import bcrypt
from datetime import date, datetime

# Add workspace root directory to sys.path to allow imports
workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(workspace_root)

from backend.app.database import engine, Base, SessionLocal
from backend.app.models import User, Listing, ListingImage, Amenity, Booking, Review, Wishlist

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def seed_database():
    print("Resetting database tables...")
    # Drop and recreate tables for clean idempotency
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding Users...")
        # Hash common password once for performance
        hashed_pw = hash_password("password123")
        
        # 3 Hosts
        host_sarah = User(
            name="Sarah Jenkins",
            email="sarah@host.com",
            hashed_password=hashed_pw,
            role="host",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        )
        host_michael = User(
            name="Michael Chen",
            email="michael@host.com",
            hashed_password=hashed_pw,
            role="host",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
        host_elena = User(
            name="Elena Rostova",
            email="elena@host.com",
            hashed_password=hashed_pw,
            role="host",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        )
        
        # 3 Guests
        guest_john = User(
            name="John Doe",
            email="john@guest.com",
            hashed_password=hashed_pw,
            role="guest",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        )
        guest_emily = User(
            name="Emily Watson",
            email="emily@guest.com",
            hashed_password=hashed_pw,
            role="guest",
            avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
        )
        guest_carlos = User(
            name="Carlos Santana",
            email="carlos@guest.com",
            hashed_password=hashed_pw,
            role="guest",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        )
        
        db.add_all([host_sarah, host_michael, host_elena, guest_john, guest_emily, guest_carlos])
        db.commit()

        print("Seeding Amenities...")
        amenity_names = [
            "Wi-Fi", "Pool", "Kitchen", "Free parking", 
            "Air conditioning", "Dedicated workspace", 
            "Gym", "Hot tub", "TV", "Pet friendly"
        ]
        amenities = {}
        for name in amenity_names:
            am = Amenity(name=name)
            db.add(am)
            amenities[name] = am
        db.commit()

        print("Seeding Listings...")
        # 18 Listings with Unsplash imagery
        listings_data = [
            # Host 1: Sarah
            {
                "host_id": host_sarah.id,
                "title": "Oceanfront Luxury Villa in Malibu",
                "description": "Experience coastal living at its finest in this stunning architectural villa. Steps from Malibu Beach, offering panoramic Pacific view deck, hot tub, and private path to the sand.",
                "category": "Beachfront",
                "price_per_night": 28000.0,
                "location_city": "Malibu",
                "location_country": "United States",
                "guests_count": 6,
                "bedrooms_count": 3,
                "bathrooms_count": 3,
                "latitude": 34.0259,
                "longitude": -118.7798,
                "images": [
                    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
                    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Air conditioning", "Hot tub", "TV"]
            },
            {
                "host_id": host_sarah.id,
                "title": "A-Frame Luxury Cabin in Aspen",
                "description": "Escape to the snow-capped Rockies in our designer A-frame chalet. Features a wood-burning fireplace, floor-to-ceiling windows, and private deck with slope view.",
                "category": "Cabins",
                "price_per_night": 18000.0,
                "location_city": "Aspen",
                "location_country": "United States",
                "guests_count": 4,
                "bedrooms_count": 2,
                "bathrooms_count": 2,
                "latitude": 39.1911,
                "longitude": -106.8175,
                "images": [
                    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
                    "https://images.unsplash.com/photo-1588880331179-bc9b93a8c5d8?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Free parking", "TV", "Pet friendly"]
            },
            {
                "host_id": host_sarah.id,
                "title": "Historic Renaissance Loft in Florence",
                "description": "Live like Tuscan royalty. Beautifully updated top-floor loft featuring original frescoed ceilings, antique details, and views of the Duomo. Close to Uffizi.",
                "category": "Design",
                "price_per_night": 9500.0,
                "location_city": "Florence",
                "location_country": "Italy",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1.5,
                "latitude": 43.7696,
                "longitude": 11.2558,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
                ],
                "amenities": ["Wi-Fi", "Air conditioning", "Dedicated workspace", "TV"]
            },
            {
                "host_id": host_sarah.id,
                "title": "Traditional Machiya Townhouse in Kyoto",
                "description": "A historic, beautifully restored merchant house in Higashiyama district. Blends traditional paper screens and tatami flooring with modern kitchen and deep soaking tub.",
                "category": "Countryside",
                "price_per_night": 14000.0,
                "location_city": "Kyoto",
                "location_country": "Japan",
                "guests_count": 4,
                "bedrooms_count": 2,
                "bathrooms_count": 1,
                "latitude": 35.0116,
                "longitude": 135.7681,
                "images": [
                    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800",
                    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Air conditioning", "Dedicated workspace"]
            },
            {
                "host_id": host_sarah.id,
                "title": "Cliffside Caldera Villa in Santorini",
                "description": "Iconic blue-domed white cave villa in Oia. Offers an infinity pool overlooking the Aegean caldera and absolute privacy for spectacular sunset views.",
                "category": "Beachfront",
                "price_per_night": 35000.0,
                "location_city": "Santorini",
                "location_country": "Greece",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1,
                "latitude": 36.4618,
                "longitude": 25.3753,
                "images": [
                    "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800",
                    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Air conditioning", "Hot tub"]
            },
            {
                "host_id": host_sarah.id,
                "title": "Glass Dome Cabin with Northern Lights View",
                "description": "Sleep under the polar night sky in our glass dome chalet outside Reykjavik. Perfect for spotting Aurora Borealis right from your comfortable queen bed.",
                "category": "Cabins",
                "price_per_night": 22000.0,
                "location_city": "Reykjavik",
                "location_country": "Iceland",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1,
                "latitude": 64.1466,
                "longitude": -21.9426,
                "images": [
                    "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
                    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"
                ],
                "amenities": ["Wi-Fi", "Free parking", "TV", "Pet friendly"]
            },
            # Host 2: Michael
            {
                "host_id": host_michael.id,
                "title": "Modernist Peak House in Cape Town",
                "description": "Ultra-sleek modern villa hanging over the cliffs of Clifton Beach. Spectacular views of Table Mountain, glass walls, lap pool, and a private wine cellar.",
                "category": "Trending",
                "price_per_night": 19500.0,
                "location_city": "Cape Town",
                "location_country": "South Africa",
                "guests_count": 8,
                "bedrooms_count": 4,
                "bathrooms_count": 4.5,
                "latitude": -33.9249,
                "longitude": 18.4241,
                "images": [
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
                    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Air conditioning", "Gym", "TV"]
            },
            {
                "host_id": host_michael.id,
                "title": "Mega Mansion with Private Cinema",
                "description": "Lavish Beverly Hills estate. Multi-acre garden, private cinema, tennis court, massive heated pool, spa, and professional butler kitchen.",
                "category": "Mansions",
                "price_per_night": 45000.0,
                "location_city": "Beverly Hills",
                "location_country": "United States",
                "guests_count": 12,
                "bedrooms_count": 6,
                "bathrooms_count": 7,
                "latitude": 34.0736,
                "longitude": -118.4004,
                "images": [
                    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800",
                    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Free parking", "Air conditioning", "Gym", "Hot tub", "TV"]
            },
            {
                "host_id": host_michael.id,
                "title": "Jungle Infinity Pool Villa in Ubud",
                "description": "Suspended over a lush river ravine, this architectural bamboo villa features a two-tiered infinity pool, open-air living spaces, and volcanic vistas.",
                "category": "Amazing pools",
                "price_per_night": 12500.0,
                "location_city": "Bali",
                "location_country": "Indonesia",
                "guests_count": 4,
                "bedrooms_count": 2,
                "bathrooms_count": 2,
                "latitude": -8.4095,
                "longitude": 115.2637,
                "images": [
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Air conditioning", "Pet friendly"]
            },
            {
                "host_id": host_michael.id,
                "title": "Luxury Ski Chalet with Hot Tub",
                "description": "High alpine retreat overlooking Verbier. Features exposed old timber beams, a sauna, indoor steam room, outdoor hot tub, and ski-in access.",
                "category": "Cabins",
                "price_per_night": 24000.0,
                "location_city": "Zermatt",
                "location_country": "Switzerland",
                "guests_count": 6,
                "bedrooms_count": 3,
                "bathrooms_count": 3,
                "latitude": 46.0207,
                "longitude": 7.7491,
                "images": [
                    "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800",
                    "https://images.unsplash.com/photo-1518098268026-4e43a1a009de?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Free parking", "Gym", "Hot tub"]
            },
            {
                "host_id": host_michael.id,
                "title": "Desert Mirror Tiny House near Joshua Tree",
                "description": "Fully mirrored futuristic container home reflecting the stunning Mojave desert. Completely off-grid, featuring outdoor fire pit and private stargazing hammock.",
                "category": "Tiny homes",
                "price_per_night": 8500.0,
                "location_city": "Joshua Tree",
                "location_country": "United States",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1,
                "latitude": 34.1347,
                "longitude": -116.3131,
                "images": [
                    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800",
                    "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Free parking", "Air conditioning", "Pet friendly"]
            },
            {
                "host_id": host_michael.id,
                "title": "Copacabana Beachfront Penthouse",
                "description": "Double-story penthouse located directly on Avenida Atlântica. Huge terrace with private splash pool, outdoor barbecue, and front-row seats to Rio's beaches.",
                "category": "Beachfront",
                "price_per_night": 16000.0,
                "location_city": "Rio de Janeiro",
                "location_country": "Brazil",
                "guests_count": 6,
                "bedrooms_count": 3,
                "bathrooms_count": 3.5,
                "latitude": -22.9707,
                "longitude": -43.1824,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Air conditioning", "TV"]
            },
            # Host 3: Elena
            {
                "host_id": host_elena.id,
                "title": "Stone Farmhouse with Lavender Views",
                "description": "Charming 18th-century stone farmhouse surrounded by lavender fields in Luberon. Features private heated pool, pergolas, and chef-quality outdoor pizza oven.",
                "category": "Countryside",
                "price_per_night": 11500.0,
                "location_city": "Provence",
                "location_country": "France",
                "guests_count": 6,
                "bedrooms_count": 3,
                "bathrooms_count": 2,
                "latitude": 43.9036,
                "longitude": 5.1873,
                "images": [
                    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
                    "https://images.unsplash.com/photo-1472214222541-d510753a4907?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Free parking", "Pet friendly"]
            },
            {
                "host_id": host_elena.id,
                "title": "Architectural Harbourview Loft in Sydney",
                "description": "Award-winning design warehouse conversion in Darlinghurst. Spectacular architectural lines, concrete ceilings, steel windows, and bridge views.",
                "category": "Design",
                "price_per_night": 15500.0,
                "location_city": "Sydney",
                "location_country": "Australia",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1.5,
                "latitude": -33.8761,
                "longitude": 151.2186,
                "images": [
                    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
                    "https://images.unsplash.com/photo-1537726257464-406177b41679?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Air conditioning", "Dedicated workspace", "TV"]
            },
            {
                "host_id": host_elena.id,
                "title": "Cliffside Palace on Positano Coast",
                "description": "Live in ultimate Italian grandeur. Historical palace built directly into the Positano cliffs. Offers direct sea elevator access, frescoed salons, and terraces.",
                "category": "Mansions",
                "price_per_night": 42000.0,
                "location_city": "Amalfi Coast",
                "location_country": "Italy",
                "guests_count": 8,
                "bedrooms_count": 4,
                "bathrooms_count": 5,
                "latitude": 40.6281,
                "longitude": 14.4850,
                "images": [
                    "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800",
                    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Air conditioning", "TV"]
            },
            {
                "host_id": host_elena.id,
                "title": "Lagoon Pool Estate in Phuket",
                "description": "Lush tropical estate featuring a large private lagoon-style pool, swim-up bar, poolside massage pavilion, and close walking path to Bang Tao beach.",
                "category": "Amazing pools",
                "price_per_night": 17000.0,
                "location_city": "Phuket",
                "location_country": "Thailand",
                "guests_count": 8,
                "bedrooms_count": 4,
                "bathrooms_count": 4,
                "latitude": 7.9843,
                "longitude": 98.2917,
                "images": [
                    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
                    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800"
                ],
                "amenities": ["Wi-Fi", "Pool", "Kitchen", "Air conditioning", "Gym", "TV"]
            },
            {
                "host_id": host_elena.id,
                "title": "Jungle Canopy Treehouse",
                "description": "Stunning off-grid, two-story treehouse suspended 30 feet high in the Costa Rican jungle canopy. Enjoy rainforest sounds, monkeys, and ocean breezes.",
                "category": "Tiny homes",
                "price_per_night": 7800.0,
                "location_city": "Limón",
                "location_country": "Costa Rica",
                "guests_count": 2,
                "bedrooms_count": 1,
                "bathrooms_count": 1,
                "latitude": 9.9281,
                "longitude": -83.0415,
                "images": [
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
                    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800"
                ],
                "amenities": ["Wi-Fi", "Free parking", "Pet friendly"]
            },
            {
                "host_id": host_elena.id,
                "title": "Sleek Shinjuku Skyline Apartment",
                "description": "High-rise designer apartment in the heart of Tokyo. Wraparound glass windows provide dramatic views of Tokyo tower and mount Fuji on clear days.",
                "category": "Trending",
                "price_per_night": 13000.0,
                "location_city": "Tokyo",
                "location_country": "Japan",
                "guests_count": 3,
                "bedrooms_count": 1,
                "bathrooms_count": 1,
                "latitude": 35.6895,
                "longitude": 139.6917,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
                    "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800"
                ],
                "amenities": ["Wi-Fi", "Kitchen", "Air conditioning", "Dedicated workspace", "TV"]
            }
        ]

        created_listings = []
        for index, item in enumerate(listings_data):
            listing = Listing(
                host_id=item["host_id"],
                title=item["title"],
                description=item["description"],
                category=item["category"],
                price_per_night=item["price_per_night"],
                location_city=item["location_city"],
                location_country=item["location_country"],
                guests_count=item["guests_count"],
                bedrooms_count=item["bedrooms_count"],
                bathrooms_count=item["bathrooms_count"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                is_active=True
            )
            # Link amenities
            for am_name in item["amenities"]:
                if am_name in amenities:
                    listing.amenities.append(amenities[am_name])
            
            db.add(listing)
            db.flush()  # Generate listing ID

            # Create listing images
            for img_url in item["images"]:
                image = ListingImage(listing_id=listing.id, image_url=img_url)
                db.add(image)

            created_listings.append(listing)
        
        db.commit()

        print("Seeding Bookings (Non-Overlapping)...")
        # Let's seed bookings on the first listing (Malibu beach villa, ID: created_listings[0].id)
        # Booking 1: Confirmed
        booking1 = Booking(
            listing_id=created_listings[0].id,
            guest_id=guest_john.id,
            check_in=date(2026, 9, 1),
            check_out=date(2026, 9, 5),
            guests_count=2,
            nightly_price=created_listings[0].price_per_night,
            number_of_nights=4,
            cleaning_fee=created_listings[0].price_per_night * 4 * 0.15,
            service_fee=created_listings[0].price_per_night * 4 * 0.10,
            total_price=created_listings[0].price_per_night * 4 * 1.25,
            status="confirmed"
        )
        # Booking 2: Confirmed (Adjacent/Non-overlapping on same listing)
        booking2 = Booking(
            listing_id=created_listings[0].id,
            guest_id=guest_emily.id,
            check_in=date(2026, 9, 5),
            check_out=date(2026, 9, 10),
            guests_count=4,
            nightly_price=created_listings[0].price_per_night,
            number_of_nights=5,
            cleaning_fee=created_listings[0].price_per_night * 5 * 0.15,
            service_fee=created_listings[0].price_per_night * 5 * 0.10,
            total_price=created_listings[0].price_per_night * 5 * 1.25,
            status="confirmed"
        )
        # Booking 3: Cancelled (Overlap with booking 2, but allowed because status is cancelled)
        booking3 = Booking(
            listing_id=created_listings[0].id,
            guest_id=guest_carlos.id,
            check_in=date(2026, 9, 7),
            check_out=date(2026, 9, 12),
            guests_count=1,
            nightly_price=created_listings[0].price_per_night,
            number_of_nights=5,
            cleaning_fee=created_listings[0].price_per_night * 5 * 0.15,
            service_fee=created_listings[0].price_per_night * 5 * 0.10,
            total_price=created_listings[0].price_per_night * 5 * 1.25,
            status="cancelled"
        )
        
        # Bookings on other listings
        # Booking on Aspen Cabin
        booking4 = Booking(
            listing_id=created_listings[1].id,
            guest_id=guest_john.id,
            check_in=date(2026, 12, 20),
            check_out=date(2026, 12, 27),
            guests_count=2,
            nightly_price=created_listings[1].price_per_night,
            number_of_nights=7,
            cleaning_fee=created_listings[1].price_per_night * 7 * 0.15,
            service_fee=created_listings[1].price_per_night * 7 * 0.10,
            total_price=created_listings[1].price_per_night * 7 * 1.25,
            status="confirmed"
        )
        
        # Booking on Florence Loft
        booking5 = Booking(
            listing_id=created_listings[2].id,
            guest_id=guest_emily.id,
            check_in=date(2026, 10, 5),
            check_out=date(2026, 10, 12),
            guests_count=2,
            nightly_price=created_listings[2].price_per_night,
            number_of_nights=7,
            cleaning_fee=created_listings[2].price_per_night * 7 * 0.15,
            service_fee=created_listings[2].price_per_night * 7 * 0.10,
            total_price=created_listings[2].price_per_night * 7 * 1.25,
            status="confirmed"
        )
        
        # Booking on Copacabana Penthouse
        booking6 = Booking(
            listing_id=created_listings[11].id,
            guest_id=guest_carlos.id,
            check_in=date(2026, 11, 1),
            check_out=date(2026, 11, 5),
            guests_count=3,
            nightly_price=created_listings[11].price_per_night,
            number_of_nights=4,
            cleaning_fee=created_listings[11].price_per_night * 4 * 0.15,
            service_fee=created_listings[11].price_per_night * 4 * 0.10,
            total_price=created_listings[11].price_per_night * 4 * 1.25,
            status="confirmed"
        )

        db.add_all([booking1, booking2, booking3, booking4, booking5, booking6])
        db.commit()

        print("Seeding Reviews...")
        # Create multiple reviews on listings from different guests
        reviews_data = [
            # Reviews on Malibu Villa
            {"listing_id": created_listings[0].id, "guest_id": guest_john.id, "rating": 5, "comment": "Absolutely spectacular view! The sound of the waves woke us up in paradise. Sarah is an excellent host."},
            {"listing_id": created_listings[0].id, "guest_id": guest_emily.id, "rating": 5, "comment": "Perfect location! The house has everything you need and matches the photos exactly. 10/10 recommendation."},
            
            # Review on Aspen Cabin
            {"listing_id": created_listings[1].id, "guest_id": guest_emily.id, "rating": 4, "comment": "Very cozy cabin, perfect after a day of snowboarding. Fireplace was wonderful. Only issue was a bit of ice on the stairs, but the host cleaned it immediately."},
            
            # Review on Florence Loft
            {"listing_id": created_listings[2].id, "guest_id": guest_carlos.id, "rating": 5, "comment": "Walking out the door and seeing the Duomo right there is unmatched. Beautiful frescos. Clean and comfortable."},
            
            # Review on Copacabana Penthouse
            {"listing_id": created_listings[11].id, "guest_id": guest_john.id, "rating": 5, "comment": "Rio has never looked better. Pool terrace was perfect for barbecues. Highly recommend!"}
        ]
        
        for rev_item in reviews_data:
            review = Review(
                listing_id=rev_item["listing_id"],
                guest_id=rev_item["guest_id"],
                rating=rev_item["rating"],
                comment=rev_item["comment"]
            )
            db.add(review)
        db.commit()

        print("Seeding Wishlists...")
        # Add 4 realistic wishlist entries (no duplicates)
        wishlist_data = [
            {"user_id": guest_john.id, "listing_id": created_listings[0].id},   # John saves Malibu Villa
            {"user_id": guest_john.id, "listing_id": created_listings[11].id},  # John saves Copacabana Penthouse
            {"user_id": guest_emily.id, "listing_id": created_listings[1].id},  # Emily saves Aspen Cabin
            {"user_id": guest_emily.id, "listing_id": created_listings[9].id}   # Emily saves Zermatt Chalet
        ]
        for wl_item in wishlist_data:
            wl = Wishlist(user_id=wl_item["user_id"], listing_id=wl_item["listing_id"])
            db.add(wl)
        db.commit()
        
        print("Database seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
