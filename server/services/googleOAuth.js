const { google } = require("googleapis");

const CALENDAR_SCOPE =
    "https://www.googleapis.com/auth/calendar.events";

const getOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

const assertConfigured = () => {
    const values = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    ];

    const hasMissing = values.some(
        (value) => !value
    );

    if (hasMissing) {
        throw new Error(
            "Google Calendar OAuth is not configured on the server"
        );
    }
};

const getAuthorizationUrl = (state) => {
    assertConfigured();

    const oauth2Client = getOAuthClient();

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [CALENDAR_SCOPE],
        state,
    });
};

const exchangeCodeForTokens = async (code) => {
    assertConfigured();

    const oauth2Client = getOAuthClient();

    const { tokens } =
        await oauth2Client.getToken(code);

    return tokens;
};

const createCalendarEvent = async ({
    user,
    summary,
    description,
    startTime,
    endTime,
    attendeeEmail,
    existingEventId,
}) => {
    if (
        !user.googleTokens?.refresh_token &&
        !user.googleTokens?.access_token
    ) {
        throw new Error(
            "Connect Google Calendar before scheduling a session"
        );
    }

    const auth = getOAuthClient();

    auth.setCredentials(
        user.googleTokens.toObject
            ? user.googleTokens.toObject()
            : user.googleTokens
    );

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const resource = {
        summary,
        description,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: "UTC",
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: "UTC",
        },
        attendees: attendeeEmail
            ? [{ email: attendeeEmail }]
            : [],
        conferenceData: {
            createRequest: {
                requestId: `skillswap-${Date.now()}-${String(
                    user._id
                )}`,
                conferenceSolutionKey: {
                    type: "hangoutsMeet",
                },
            },
        },
    };

    const response = existingEventId
        ? await calendar.events.update({
            calendarId: "primary",
            eventId: existingEventId,
            resource,
            conferenceDataVersion: 1,
            sendUpdates: "all",
        })
        : await calendar.events.insert({
            calendarId: "primary",
            resource,
            conferenceDataVersion: 1,
            sendUpdates: "all",
        });

    return response.data;
};

module.exports = {
    getAuthorizationUrl,
    exchangeCodeForTokens,
    createCalendarEvent,
};