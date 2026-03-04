import requests
import time

BASE_URL = "http://127.0.0.1:5000"

def test_reallocation():
    print("--- Testing Dynamic Re-allocation ---")
    
    # 1. Reset slots
    print("Resetting slots...")
    requests.get(f"{BASE_URL}/reset-slots")
    
    # 2. Signup / Login (Assume user exists or create one)
    email = "test@example.com"
    print(f"Logging in as {email}...")
    login_res = requests.post(f"{BASE_URL}/login", json={"email": email, "password": "password"})
    if login_res.status_code != 200:
        print("User not found, signing up...")
        requests.post(f"{BASE_URL}/signup", json={"name": "Test User", "email": email, "password": "password"})
    
    # 3. Save vehicle
    print("Saving vehicle...")
    requests.post(f"{BASE_URL}/vehicle/details", json={"email": email, "plate_number": "ABC-123"})
    v_list = requests.get(f"{BASE_URL}/vehicle/list/{email}").json()
    v_id = v_list[0]['id']
    
    # 4. Create reservation for A1
    print("Creating reservation for A1...")
    res = requests.post(f"{BASE_URL}/reservation/create", json={
        "email": email,
        "vehicle_id": v_id,
        "start_time": "2026-03-04 20:00",
        "end_time": "2026-03-04 22:00"
    })
    print(res.json())
    
    # 5. Simulate vision system blocking A1
    print("\nSimulating vision system blocking A1...")
    block_res = requests.post(f"{BASE_URL}/update-slot", json={
        "slot_code": "A1",
        "status": "blocked"
    })
    print("Block result:", block_res.json())
    
    # 6. Verify notification
    print("\nChecking notifications...")
    notes = requests.get(f"{BASE_URL}/notifications/{email}").json()
    if notes:
        print("Latest Notification:", notes[0]['title'])
        print("Message:", notes[0]['message'])
    
    # 7. Check current slots
    print("\nChecking slot status...")
    slots = requests.get(f"{BASE_URL}/slots/status").json()
    print("Available (non-blocked) slots in UI:", [s['slot_code'] for s in slots])

if __name__ == "__main__":
    test_reallocation()
