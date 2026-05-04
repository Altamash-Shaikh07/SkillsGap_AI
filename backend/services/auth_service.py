from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os
import random
import smtplib
from email.mime.text import MIMEText

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "secret")
ALGORITHM = "HS256"

def hash_password(password: str):
    return pwd_context.hash(password[:72])  

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=1440)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_otp():
    return str(random.randint(100000, 999999))

def send_email_otp(email, otp):
    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")

    if not user or not password:
        print(f"OTP for {email}: {otp}")
        return

    msg = MIMEText(f"Your OTP is {otp}")
    msg["Subject"] = "Verify your email"
    msg["From"] = user
    msg["To"] = email

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(user, password)
    server.sendmail(user, email, msg.as_string())
    server.quit()