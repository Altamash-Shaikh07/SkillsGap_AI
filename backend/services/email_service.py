import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

# ✅ Force load .env from project root
load_dotenv()

def send_otp_email(to_email, otp):
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASSWORD")

    # 🔍 DEBUG (VERY IMPORTANT)
    print("ENV EMAIL:", sender_email)
    print("ENV PASS:", sender_password)

    if not sender_email or not sender_password:
        print("❌ Email credentials not set in .env")
        return False

    # ✅ Email Content
    html_content = f"""
    <html>
    <body style="font-family: Arial; background:#f4f6f8; padding:20px;">
        <div style="max-width:500px;margin:auto;background:#fff;padding:20px;border-radius:10px;">
            <h2 style="color:#2563eb;text-align:center;">SkillGap AI 🚀</h2>

            <p>Hello,</p>

            <p>Use the OTP below to continue:</p>

            <div style="text-align:center;margin:20px 0;">
                <span style="font-size:24px;font-weight:bold;background:#f1f5f9;padding:10px 20px;border-radius:8px;">
                    {otp}
                </span>
            </div>

            <p>This OTP is valid for 10 minutes.</p>

            <hr />
            <p style="text-align:center;font-size:12px;">© 2026 SkillGap AI</p>
        </div>
    </body>
    </html>
    """

    msg = MIMEText(html_content, "html")
    msg["Subject"] = "SkillGap AI - OTP Verification"
    msg["From"] = sender_email
    msg["To"] = to_email

    try:
        print(f"📤 Sending OTP to {to_email}...")

        # ✅ Stronger SMTP connection
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()

        server.login(sender_email, sender_password)
        print("✅ Gmail login successful")

        server.sendmail(sender_email, to_email, msg.as_string())
        print("✅ Email sent successfully")

        server.quit()
        return True

    except smtplib.SMTPAuthenticationError:
        print("❌ Authentication failed → Check App Password")
    except smtplib.SMTPConnectError:
        print("❌ Connection error → Check internet/firewall")
    except Exception as e:
        print("❌ Email error:", str(e))

    return False