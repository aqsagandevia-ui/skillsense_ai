import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const tokensParam = searchParams.get("tokens");
        
        if (!tokensParam) {
          setStatus("error");
          return;
        }

        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        
        // Get the stored JWT token
        const jwtToken = localStorage.getItem("token");
        
        if (!jwtToken) {
          setStatus("error");
          return;
        }

        // Send tokens to server to save
        const response = await fetch("/api/auth/save-google-tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ tokens })
        });

        if (response.ok) {
          setStatus("success");
          // Refresh user data to update UI
          await refreshUser();
          // Redirect after short delay
          setTimeout(() => {
            navigate("/profile");
          }, 2000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Connecting your Google account...</h2>
            <p className="text-gray-500 mt-2">Please wait while we complete the setup.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Google Account Connected!</h2>
            <p className="text-gray-500 mt-2">Redirecting to your profile...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connection Failed</h2>
            <p className="text-gray-500 mt-2">There was an error connecting your Google account. Please try again.</p>
            <button 
              onClick={() => navigate("/profile")}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Go to Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
