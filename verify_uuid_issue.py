import uuid
import sys

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

# Mock data
users = ["Neocryptz", "user123", "0f0d371d-b860-457e-bb61-754106590f57"]

for u in users:
    print(f"User: {u}, Valid UUID: {is_valid_uuid(u)}")
