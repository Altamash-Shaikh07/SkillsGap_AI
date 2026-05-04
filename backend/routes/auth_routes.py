from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from datetime import datetime, timedelta
from services.auth_service import *
from middleware.auth_middleware import get_current_user
from pymongo import MongoClient
from bson import ObjectId
from services.email_service import send_otp_email
import os
import requests
import shutil
import uuid

router = APIRouter()

# =========================
# DATABASE
# =========================
client = MongoClient(os.getenv("MONGO_URI"))
db = client["skillsgap_ai"]
users = db["users"]
roadmaps = db["roadmaps"]

# 🔥 GLOBAL OTP STORE (IMPORTANT)
otp_store = {}

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# =========================
# AUTH
# =========================

# ✅ REGISTER (SEND OTP ONLY)
@router.post("/register")
def register(data: dict):
    email = data.get("email").lower().strip()
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    if users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    otp = generate_otp()

    otp_store[email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10),
        "data": {"email": email, "password": password}
    }

    print("📦 OTP STORED:", otp_store)  # DEBUG

    send_otp_email(email, otp)

    return {"message": "OTP sent to email"}


# ✅ VERIFY OTP (CREATE USER HERE)
@router.post("/verify-otp")
def verify_otp(data: dict):
    email = data.get("email").lower().strip()
    otp = str(data.get("otp")).strip()

    print("🔍 VERIFY EMAIL:", email)
    print("📦 OTP STORE:", otp_store)

    user_otp = otp_store.get(email)

    if not user_otp:
        raise HTTPException(status_code=400, detail="OTP not found")

    # expiry check
    if datetime.utcnow() > user_otp["expires"]:
        del otp_store[email]
        raise HTTPException(status_code=400, detail="OTP expired")

    # OTP check
    if str(user_otp["otp"]) != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user_data = user_otp["data"]

    # 🔥 CREATE USER AFTER VERIFY
    hashed_password = hash_password(user_data["password"])

    users.insert_one({
        "email": user_data["email"],
        "password": hashed_password
    })

    # remove OTP after success
    del otp_store[email]

    print("✅ USER CREATED:", user_data["email"])

    return {"message": "Signup successful"}


# ✅ RESEND OTP
@router.post("/resend-otp")
def resend_otp(data: dict):
    email = data.get("email").lower().strip()

    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    if email not in otp_store:
        raise HTTPException(status_code=400, detail="No OTP request found")

    otp = generate_otp()

    otp_store[email]["otp"] = otp
    otp_store[email]["expires"] = datetime.utcnow() + timedelta(minutes=10)

    print("🔁 RESENT OTP:", otp)

    send_otp_email(email, otp)

    return {"message": "OTP resent successfully"}


# ✅ LOGIN
@router.post("/login")
def login(data: dict):
    email = data.get("email").lower().strip()
    password = data.get("password")

    user = users.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_token({"user_id": str(user["_id"])})

    return {
        "access_token": token,
        "user": {"email": user["email"]}
    }


# ✅ PROFILE
@router.get("/profile")
def profile(user=Depends(get_current_user)):
    return user


# =========================
# RESUME UPLOAD
# =========================
@router.post("/upload-resume")
def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    users.update_one(
        {"_id": ObjectId(user["user_id"])},
        {"$set": {"resume_url": file_path}}
    )

    return {"message": "Resume uploaded", "path": file_path}


# =========================
# ROADMAP
# =========================
@router.post("/generate-roadmap")
def generate_roadmap(data: dict, user=Depends(get_current_user)):

    skill = data.get("skill")

    if not skill:
        raise HTTPException(status_code=400, detail="Skill required")

    api_key = os.getenv("GEMINI_API_KEY")

    try:
        model = "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        prompt = f"Create a step-by-step roadmap to learn {skill}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }

        response = requests.post(url, json=payload)

        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]

    except:
        text = f"""
Step 1: Learn basics of {skill}
Step 2: Practice daily
Step 3: Build projects
Step 4: Prepare for interviews
"""

    roadmaps.insert_one({
        "user_id": user["user_id"],
        "skill": skill,
        "generated_content": text
    })

    return {"roadmap": text}