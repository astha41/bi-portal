# app/routes/superset.py
from fastapi import APIRouter
import requests
from fastapi import Request
router = APIRouter(prefix="/superset", tags=["Superset"])

SUPERSET_URL = "http://localhost:8088"
USERNAME = "admin"
PASSWORD = "admin"


# ✅ ADD dashboard_id parameter
@router.get("/token/{dashboard_id}")
def get_superset_token(dashboard_id: str):
    session = requests.Session()

    # Login
    login_res = session.post(
        f"{SUPERSET_URL}/api/v1/security/login",
        json={"username": USERNAME, "password": PASSWORD, "provider": "db"},
    )
    access_token = login_res.json().get("access_token")
    if not access_token:
        return {"error": "No access token returned from Superset"}

    # CSRF
    csrf_res = session.get(
        f"{SUPERSET_URL}/api/v1/security/csrf_token/",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    csrf_token = csrf_res.json().get("result")

    # Guest token
    guest_res = session.post(
        f"{SUPERSET_URL}/api/v1/security/guest_token/",
        headers={
            "Authorization": f"Bearer {access_token}",
            "X-CSRFToken": csrf_token,
            "Referer": SUPERSET_URL,
        },
        json={
            # ✅ USE dynamic dashboard_id HERE
            "resources": [{"type": "dashboard", "id": dashboard_id}],
            "rls": [],
            "user": {"username": "guest_user"},
        },
    )

    guest_json = guest_res.json()
    if "result" in guest_json and "token" in guest_json["result"]:
        return {"token": guest_json["result"]["token"]}
    elif "token" in guest_json:
        return {"token": guest_json["token"]}
    else:
        return {"error": "Failed to get guest token", "details": guest_json}


favorites = set()

@router.post("/favorites/{dashboard_id}")
def toggle_favorite(dashboard_id: str):
    if dashboard_id in favorites:
        favorites.remove(dashboard_id)
        return {"isFavorite": False}
    else:
        favorites.add(dashboard_id)
        return {"isFavorite": True}


@router.get("/favorites/{dashboard_id}")
def get_favorite(dashboard_id: str):
    return {"isFavorite": dashboard_id in favorites}