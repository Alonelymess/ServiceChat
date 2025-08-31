import requests
import json


question = """Scenario: new-baby
User: I just had a baby. What kinds paperwork should I complete?"""

response = requests.post(
    "http://localhost:8000/chat",
    headers={"Content-Type": "application/json"},
    data=json.dumps({
        "message": question,
        "user_id": "test_user_1",
        "role": "user"
    })
)
print(response.json())