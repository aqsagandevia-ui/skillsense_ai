import { useState } from "react";

const mockAiMatches = [
  {
    id: 1,
    name: "Charlie Davis",
    photo: "https://i.pravatar.cc/150?img=8",
    skill: "React & Next.js",
    skillLevel: "Expert",
    similarity: 96,
    trustScore: 4.8,
    bio: "Senior frontend developer specializing in React ecosystem. 8+ years of experience.",
    reason: "Perfect match for your React learning goals"
  },
  {
    id: 2,
    name: "Dana Scully",
    photo: "https://i.pravatar.cc/150?img=9",
    skill: "Machine Learning",
    skillLevel: "Advanced",
    similarity: 91,
    trustScore: 4.9,
    bio: "AI researcher with PhD. Passionate about teaching complex concepts simply.",
    reason: "Highly rated ML expert matching your interests"
  },
  {
    id: 3,
    name: "Eva Martinez",
    photo: "https://i.pravatar.cc/150?img=10",
    skill: "UI/UX Design",
    skillLevel: "Expert",
    similarity: 87,
    trustScore: 4.7,
    bio: "Design lead at Fortune 500. Teaching design thinking and practical UI skills.",
    reason: "Top-rated designer with teaching experience"
  },
  {
    id: 4,
    name: "Frank Wilson",
    photo: "https://i.pravatar.cc/150?img=11",
    skill: "Data Science",
    skillLevel: "Advanced",
    similarity: 84,
    trustScore: 4.6,
    bio: "Data scientist at a major tech company. Love explaining ML concepts.",
    reason: "Strong match for data science learning"
  }
];

export default function AiMatches() {
  const [matches] = useState(mockAiMatches);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Matches
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our AI analyzes your profile to find the best skill exchange partners based on compatibility and learning goals
          </p>
        </div>

        {matches.length === 0 ? (
          <div className-16 bg-white="text-center py rounded-2xl shadow-sm">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No AI matches yet</h3>
            <p className="mt-2 text-gray-500">Complete your profile to get AI recommendations!</p>
            <a href="/profile" className="mt-6 inline-block px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              Complete Profile
            </a>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-purple-100"
              >
                <div className="p-6">
                  {/* AI Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-purple-600 font-semibold text-sm">AI Match</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-green-600 font-semibold text-sm">{match.trustScore}</span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={match.photo}
                      alt={match.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{match.name}</h3>
                      <p className="text-sm text-gray-500">{match.skillLevel}</p>
                    </div>
                  </div>

                  {/* Similarity Score */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Match Score</span>
                      <span className="font-semibold text-purple-600">{match.similarity}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${match.similarity}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mb-4 p-3 bg-purple-50 rounded-xl">
                    <p className="text-sm text-purple-700">{match.reason}</p>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{match.bio}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Connect
                    </button>
                    <button className="px-4 py-2.5 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
