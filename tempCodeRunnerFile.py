import pytest
from app import app, db, User, Flight, Hotel, Booking
from werkzeug.security import check_password_hash

# ==========================================
# 1. THE SETUP (FIXTURES)
# ==========================================
@pytest.fixture
def client():
    # Tell Flask we are in testing mode
    app.config['TESTING'] = True
    
    # CRITICAL: Point the database to your computer's RAM (Memory)
    # This prevents your real voyagesync.db from being touched!
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.test_client() as client:
        with app.app_context():
            # Create the fresh ghost database
            db.create_all()
            
            # Add a fake flight and hotel for our booking tests
            test_flight = Flight(airline="Test Air", departure="NYC", destination="LON", price=100.0, time="08:00 AM")
            test_hotel = Hotel(name="Test Inn", location="LON", room_type="Suite", price_per_night=50.0)
            db.session.add_all([test_flight, test_hotel])
            db.session.commit()
            
            # Pause here and let the tests run
            yield client
            
            # Destroy the ghost database when tests are done
            db.drop_all()

# ==========================================
# 2. THE TESTS (UNITS)
# ==========================================

def test_homepage_loads(client):
    """UNIT 1: Does the site actually turn on?"""
    response = client.get('/')
    assert response.status_code == 200
    assert b"Experience VoyageSync" in response.data

def test_flights_and_hotels_load(client):
    """UNIT 2: Do the search pages pull data from the DB?"""
    flight_res = client.get('/flights')
    hotel_res = client.get('/hotels')
    
    assert flight_res.status_code == 200
    assert b"Test Air" in flight_res.data  # Checks if our ghost DB flight shows up
    
    assert hotel_res.status_code == 200
    assert b"Test Inn" in hotel_res.data   # Checks if our ghost DB hotel shows up

def test_signup_short_password_logic(client):
    """UNIT 3: Does the security system block weak passwords?"""
    response = client.post('/signup', data={
        'username': 'hacker',
        'email': 'hacker@test.com',
        'password': '123',
        'confirm_password': '123'
    }, follow_redirects=True)
    
    assert b'Password must be at least 8 characters long' in response.data
    # Verify the database is still empty
    assert User.query.count() == 0

def test_signup_mismatched_passwords(client):
    """UNIT 4: Does the system catch typos in the confirm password box?"""
    response = client.post('/signup', data={
        'username': 'typo_guy',
        'email': 'typo@test.com',
        'password': 'StrongPassword1@',
        'confirm_password': 'StrongPassword2@'
    }, follow_redirects=True)
    
    assert b'Passwords do not match' in response.data

def test_successful_signup_creates_user(client):
    """UNIT 5: Does a perfect signup actually save to the Database?"""
    response = client.post('/signup', data={
        'username': 'legit_user',
        'email': 'legit@test.com',
        'password': 'SuperSecret123!',
        'confirm_password': 'SuperSecret123!'
    }, follow_redirects=True)
    
    assert b'Account created!' in response.data
    
    # Actually query the database to prove the user exists!
    new_user = User.query.filter_by(username='legit_user').first()
    assert new_user is not None
    assert new_user.email == 'legit@test.com'
    # Prove the password was safely encrypted, not saved as plain text
    assert new_user.password_hash != 'SuperSecret123!' 
    assert check_password_hash(new_user.password_hash, 'SuperSecret123!')

def test_protected_profile_route(client):
    """UNIT 6: Can a sneaky user access the profile page without logging in?"""
    # Act: Try to go directly to the profile page
    response = client.get('/profile', follow_redirects=False)
    
    # Assert: 302 is the official web code for "Redirect / Bounced"
    assert response.status_code == 302 
    # Ensure they were kicked back to the homepage
    assert response.location == '/'