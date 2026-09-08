import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Timer effect for OTP expiry (1 minute countdown)
  useEffect(() => {
    if (otpTimer <= 0) return;
    
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning("OTP has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      // Handle specific error for Google users
      if (!res.ok) {
        if (data.msg && data.msg.includes("Google sign-in")) {
          toast.error("This account uses Google login. Please log in with Google.");
        } else {
          toast.error(data.msg || "Failed to send OTP");
        }
        return;
      }
      toast.success("OTP sent to your email!");
      setStep(2);
      setOtpTimer(60); // Start 60-second countdown
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("OTP is required");
      return;
    }
    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.msg || "Invalid OTP");
        return;
      }
      toast.success("OTP verified! Enter your new password");
      setStep(3);
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error("Password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password-with-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.msg || "Failed to reset password");
        return;
      }
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 1) return "Forgot Password?";
    if (step === 2) return "Verify Email";
    return "New Password";
  };

  const getStepDesc = () => {
    if (step === 1) return "Enter your registered email";
    if (step === 2) return "Enter the code sent to " + email;
    return "Create a strong password";
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800" alt="bg" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-indigo-900/80" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Reset Your<br />Password</h1>
          <p className="text-xl opacity-90">
            {step === 1 && "Enter your email to receive a code"}
            {step === 2 && "Enter the 6-digit code"}
            {step === 3 && "Create a new password"}
          </p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{getStepTitle()}</h2>
            <p className="text-gray-500 mt-2">{getStepDesc()}</p>
          </div>
          
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-70"
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter 6-digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  disabled={otpTimer === 0}
                />
                <p className="mt-2 text-sm text-gray-500">OTP sent to {email}</p>
                <p className={`mt-2 text-sm font-semibold ${otpTimer > 10 ? 'text-gray-600' : 'text-red-600'}`}>
                  Expires in: <span className="font-mono">{otpTimer}s</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6 || otpTimer === 0}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-70"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <button type="button" onClick={() => { setStep(1); setOtpTimer(0); setOtp(""); }} className="w-full mt-3 text-gray-500 text-sm">Change email</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter new password"
                />
                <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Confirm password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || password.length < 6 || password !== confirmPassword}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-70"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          <p className="text-center text-gray-600 mt-8">
            Remember password? <Link to="/login" className="text-primary font-semibold">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

