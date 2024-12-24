from concurrent.futures import ThreadPoolExecutor
import requests 

def update_user(user_id, new_username, new_email):
    payload = {
        "user_info": {
            "username": new_username,
            "email": new_email,
            "password_hash": "newpassword",
            "first_name": "newfirstname", 
            "last_name": "newlastname", 
            "specialty": "newspecialty", 
            "phone_number": 12342345, 
        }
    }
    response = requests.put(f"http://127.0.0.1:5000/user/{user_id}", json=payload)
    print(response.json())

# Test multiple concurrent updates
with ThreadPoolExecutor(max_workers=10) as executor:
    for i in range(10):
        executor.submit(update_user, 1, f"user_{i}", f"user{i}@example.com")
