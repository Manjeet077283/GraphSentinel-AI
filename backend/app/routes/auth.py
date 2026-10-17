"""
GraphSentinel AI - Authentication & User Profile Routes
Provides secure backend-validated authentication, PBKDF2 password hashing,
session tokens, and comprehensive user profile management.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from backend.app.schemas import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserProfile,
    UpdateProfileRequest,
    ChangePasswordRequest
)
from backend.app.persistence import (
    authenticate_user,
    create_user,
    create_session,
    get_user_by_token,
    delete_session,
    get_user_full_profile,
    update_user_profile,
    change_user_password
)

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None)
) -> dict:
    """Dependency to extract and validate the authenticated session."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_session_token:
        token = x_session_token.strip()

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please log in.")

    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")

    return user


def _format_user_profile(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name") or user.get("full_name") or "",
        "full_name": user.get("full_name") or user.get("name") or "",
        "display_name": user.get("display_name") or user.get("name") or "",
        "role": user.get("role") or "Site Reliability Engineer",
        "phone": user.get("phone") or "",
        "job_title": user.get("job_title") or "",
        "department": user.get("department") or "",
        "organization": user.get("organization") or "",
        "bio": user.get("bio") or "",
        "location": user.get("location") or "",
        "avatar_url": user.get("avatar_url") or "",
        "preferred_language": user.get("preferred_language") or "en",
        "time_zone": user.get("time_zone") or "UTC",
        "notification_preferences": user.get("notification_preferences") or '{"email": true, "slack": true, "severity_threshold": "P2_HIGH"}',
        "status": user.get("status") or "ACTIVE",
        "created_at": user.get("created_at") or ""
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    """Authenticates credentials against the secure persistent store."""
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password. Please check your credentials."
        )

    full_profile = get_user_full_profile(user["id"]) or user
    token = create_session(user["id"])
    return {
        "token": token,
        "user": _format_user_profile(full_profile)
    }


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest):
    """Registers a new user in the persistent store."""
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    user = create_user(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role or "Site Reliability Engineer"
    )

    if not user:
        raise HTTPException(status_code=409, detail="A user with this email address already exists.")

    full_profile = get_user_full_profile(user["id"]) or user
    token = create_session(user["id"])
    return {
        "token": token,
        "user": _format_user_profile(full_profile)
    }


@router.get("/me", response_model=UserProfile)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's complete profile."""
    full_profile = get_user_full_profile(current_user["id"]) or current_user
    return _format_user_profile(full_profile)


@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: dict = Depends(get_current_user)):
    """Explicit alias for user profile."""
    full_profile = get_user_full_profile(current_user["id"]) or current_user
    return _format_user_profile(full_profile)


@router.put("/profile", response_model=UserProfile)
def update_profile(
    payload: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Updates user profile settings and preferences."""
    updates = payload.model_dump(exclude_unset=True)
    updated = update_user_profile(current_user["id"], updates)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile.")
    return _format_user_profile(updated)


@router.post("/change-password")
def update_password(
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Securely updates the authenticated user's password."""
    res = change_user_password(current_user["id"], payload.current_password, payload.new_password)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return {"status": "success", "message": res["message"]}


@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None)
):
    """Terminates the session and revokes the session token."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_session_token:
        token = x_session_token.strip()

    if token:
        delete_session(token)

    return {"status": "success", "message": "Logged out successfully."}
