import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const location = useLocation();

  // Fetch fresh user data on mount to ensure photo is up to date
  useEffect(() => {
    const fetchFreshUser = async () => {
      if (localStorage.getItem("token")) {
        await refreshUser();
      }
    };
    fetchFreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout(navigate);
  };

  // Hide global navbar on admin pages (admin has its own layout)
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed w-full z-50 glass border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SkillSense AI
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {/* Role-based navigation */}
            {!user && (
              <>
                <Link to="/browse" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Browse Skills</Link>
                <Link to="/login" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Login</Link>
              </>
            )}

            {user?.role === 'learner' && (
              <>
                <Link to="/learner-dashboard" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Dashboard</Link>
                <Link to="/browse" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Find Mentors</Link>
                <Link to="/my-requests" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Requests</Link>
                <Link to="/chat" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Chat</Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Profile</Link>
              </>
            )}

            {user?.role === 'mentor' && (
              <>
                <Link to="/mentor-dashboard" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Dashboard</Link>
                <Link to="/my-requests" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Requests</Link>
                <Link to="/sessions" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Sessions</Link>
                <Link to="/chat" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Chat</Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Profile</Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="text-gray-700 hover:text-primary font-medium transition-colors duration-200 relative group">Admin</Link>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  {user?.photo ? (
                    <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="px-5 py-2.5 text-gray-700 font-medium hover:text-primary transition-colors duration-200">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2.5 text-gray-700 font-medium hover:text-primary transition-colors duration-200">
                  Login
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-0.5">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden glass border-t border-gray-200/50">
          <div className="px-4 py-4 space-y-3">
            {!user && (
              <>
                <Link to="/browse" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Browse Skills</Link>
                <Link to="/login" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Login</Link>
              </>
            )}

            {user?.role === 'learner' && (
              <>
                <Link to="/learner-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/browse" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Find Mentors</Link>
                <Link to="/my-requests" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Requests</Link>
                <Link to="/chat" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Chat</Link>
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              </>
            )}

            {user?.role === 'mentor' && (
              <>
                <Link to="/mentor-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/my-requests" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Requests</Link>
                <Link to="/sessions" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Sessions</Link>
                <Link to="/chat" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Chat</Link>
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>Admin</Link>
              </>
            )}
            <div className="pt-3 border-t border-gray-200">
              {user ? (
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                  Logout
                </button>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="block px-4 py-2 text-center text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="block px-4 py-2 text-center bg-gradient-to-r from-primary to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
