const express = require("express");
const router = express.Router();
const { register, login, getMe, googleLogin, saveGoogleTokens, forgotPassword, resetPassword, sendResetOtp, verifyResetOtp, resetPasswordWithOtp } = require("../controllers/authController");
const auth = require("../middleware/auth");

// User registration and login
router.post("/register", register);
router.post("/login", login);

// Password reset routes (token-based - legacy)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Password reset routes (OTP-based)
router.post("/send-reset-otp", sendResetOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password-with-otp", resetPasswordWithOtp);

// Google OAuth login
router.post("/google", googleLogin);

// Save Google OAuth tokens (protected)
router.post("/save-google-tokens", auth, saveGoogleTokens);

// Get current user (protected)
router.get("/me", auth, getMe);

module.exports = router;

