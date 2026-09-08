import { useState, useEffect } from "react";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/matches/matches", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Matches
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            People who match your skill exchange preferences
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No matches yet</h3>
            <p className="mt-2 text-gray-500">Update your profile with skills to find matches!</p>
            <a href="/profile" className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              Update Profile
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match._id}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {match.photo ? (
                        <img src={match.photo} alt={match.name} className="w-16 h-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                          {match.name ? match.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{match.name || "User"}</h3>
                        <p className="text-sm text-gray-500">{match.title || "Skill Enthusiast"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-green-600 font-bold">{match.matchScore || 0}%</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{match.bio || "No bio available"}</p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Can Teach</span>
                      </div>
                      <span className="text-primary font-semibold text-sm">
                        {match.skills?.filter(s => s.type === "teach").map(s => s.name).join(", ") || "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Wants to Learn</span>
                      </div>
                      <span className="text-secondary font-semibold text-sm">
                        {match.skills?.filter(s => s.type === "learn").map(s => s.name).join(", ") || "Not specified"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
                      Connect
                    </button>
                    <button className="px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
