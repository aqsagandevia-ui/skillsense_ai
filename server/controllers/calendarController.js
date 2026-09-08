const jwt = require("jsonwebtoken");
const User = require("../models/User");

const {
    getAuthorizationUrl,
    exchangeCodeForTokens,
} = require("../services/googleOAuth");

const clientUrl = () =>
    process.env.CLIENT_URL || "http://localhost:5173";

exports.getConnectUrl = async (req, res) => {
    try {
        const state = jwt.sign(
            {
                userId: req.user.id,
                purpose: "google-calendar",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10m",
            }
        );

        const url = getAuthorizationUrl(state);

        res.json({ url });
    } catch (error) {
        console.error("Get Calendar Connect URL Error:", error);

        res.status(500).json({
            msg: error.message,
        });
    }
};

exports.oauthCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // User cancelled Google authorization
        if (error) {
            return res.redirect(
                `${clientUrl()}/mentor-dashboard?calendar=error`
            );
        }

        if (!code || !state) {
            return res.redirect(
                `${clientUrl()}/mentor-dashboard?calendar=error`
            );
        }

        // Verify OAuth state
        const payload = jwt.verify(
            state,
            process.env.JWT_SECRET
        );

        if (payload.purpose !== "google-calendar") {
            throw new Error("Invalid OAuth state");
        }

        // Exchange Google authorization code
        const tokens = await exchangeCodeForTokens(code);

        // Find mentor
        const user = await User.findById(payload.userId);

        if (!user || user.role !== "mentor") {
            throw new Error(
                "Only mentors can connect Google Calendar"
            );
        }

        // Preserve existing tokens
        const currentTokens = user.googleTokens?.toObject
            ? user.googleTokens.toObject()
            : user.googleTokens || {};

        user.googleTokens = {
            ...currentTokens,
            ...tokens,
        };

        await user.save();

        console.log(
            `Google Calendar connected for mentor: ${user._id}`
        );

        // ⭐ IMPORTANT REDIRECT
        return res.redirect(
            `${clientUrl()}/mentor-dashboard?calendar=connected`
        );

    } catch (error) {
        console.error(
            "Google Calendar OAuth callback error:",
            error.message
        );

        return res.redirect(
            `${clientUrl()}/mentor-dashboard?calendar=error`
        );
    }
};

exports.getStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("googleTokens");

        res.json({
            connected: Boolean(
                user?.googleTokens?.refresh_token ||
                user?.googleTokens?.access_token
            ),
        });
    } catch (error) {
        res.status(500).json({
            msg: error.message,
        });
    }
};

exports.disconnect = async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            {
                $unset: {
                    googleTokens: 1,
                },
            }
        );

        res.json({
            connected: false,
        });
    } catch (error) {
        res.status(500).json({
            msg: error.message,
        });
    }
};