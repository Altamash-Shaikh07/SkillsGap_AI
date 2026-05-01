import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("signup");
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const navigate = useNavigate();

  // SEND OTP
  const handleSendOtp = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("OTP sent successfully 📩");
        setOtpSent(true);
      } else {
        setMessage(data.detail || "Failed to send OTP");
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    if (verifying) return;

    setVerifying(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Signup successful ✅");
        setMode("login");
        setOtpSent(false);
      } else {
        setMessage(data.detail || "Verification failed");
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }

    setVerifying(false);
  };

  // LOGIN (🔥 IMPORTANT FIX)
  const handleLogin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.access_token) {
        localStorage.setItem("token", data.access_token);

        console.log("LOGIN SUCCESS → navigating to upload");

        navigate("/upload"); // ✅ always redirect here
      } else {
        setMessage(data.detail || "Login failed");
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  // RESEND OTP
  const handleResendOtp = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("OTP resent successfully 📩");
      } else {
        setMessage(data.detail);
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="card w-full max-w-md p-8">

        {message && (
          <p className="text-green-400 text-sm mb-3 text-center">
            {message}
          </p>
        )}

        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {mode === "signup" ? "Create Account" : "Login"}
        </h2>

        <input
          className="w-full p-3 mb-4 rounded bg-white/5 text-white border border-white/10"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 mb-4 rounded bg-white/5 text-white border border-white/10"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "signup" && !otpSent && (
          <button className="btn-primary w-full" onClick={handleSendOtp}>
            Send OTP
          </button>
        )}

        {mode === "signup" && otpSent && (
          <>
            <input
              className="w-full p-3 mt-4 mb-4 rounded bg-white/5 text-white border border-white/10"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              className="btn-primary w-full"
              onClick={handleVerifyOtp}
              disabled={verifying}
            >
              {verifying ? "Verifying..." : "Verify & Signup"}
            </button>

            <button
              onClick={handleResendOtp}
              className="text-sm text-blue-400 mt-2 w-full text-center"
            >
              Resend OTP
            </button>
          </>
        )}

        {mode === "login" && (
          <button className="btn-primary w-full" onClick={handleLogin}>
            Login
          </button>
        )}

        <p
          className="text-center text-sm text-slate-400 mt-4 cursor-pointer"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setOtpSent(false);
          }}
        >
          {mode === "signup"
            ? "Already have an account? Login"
            : "Don't have an account? Signup"}
        </p>

      </div>
    </div>
  );
}