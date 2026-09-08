import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import BrowseSkills from "./pages/BrowseSkills";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Chat from "./pages/Chat";
import Sessions from "./pages/Sessions";
import Matches from "./pages/Matches";
import MyRequests from "./pages/MyRequests";
import OAuthCallback from "./pages/OAuthCallback";
import SkillDetails from "./pages/SkillDetails";
import MentorProfile from "./pages/MentorProfile";
import MentorDashboard from "./pages/MentorDashboard";
import LearnerDashboard from "./pages/LearnerDashboard";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminSkills from "./pages/admin/AdminSkills";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import MentorReviews from "./pages/MentorReviews";

export default function App() {
  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen">
        <Routes>
          {/* ✅ Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          <Route
            path="/skill/:title"
            element={
              <ProtectedRoute>
                <SkillDetails />
              </ProtectedRoute>
            }
          />
          {/* 🔐 Protected Skill Details (IMPORTANT FIX) */}
          <Route
            path="/skill-details"
            element={
              <ProtectedRoute>
                <SkillDetails />
              </ProtectedRoute>
            }
          />

          {/* 🔐 Other Protected Routes */}
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <BrowseSkills />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentor-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["mentor"]}>
                <MentorDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/mentor-reviews"
            element={
              <RoleProtectedRoute allowedRoles={["mentor"]}>
                <MentorReviews />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/learner-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["learner"]}>
                <LearnerDashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:mentorId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentor/:id"
            element={
              <ProtectedRoute>
                <MentorProfile />
              </ProtectedRoute>
            }
          />

          {/* 🔁 Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* Admin routes */}
          <Route
            path="/admin/*"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sessions" element={<AdminSessions />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="skills" element={<AdminSkills />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}
