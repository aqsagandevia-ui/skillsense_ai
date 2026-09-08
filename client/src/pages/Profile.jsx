import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams(); // For viewing other mentor profiles
  const location = useLocation();
  const mentorIdFromState = location.state?.mentorId;
  const viewingMentorId = id || mentorIdFromState;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [viewingMode, setViewingMode] = useState(!!viewingMentorId); // true when viewing someone else's profile
  const [skills, setSkills] = useState([]);
  const [skillsToLearn, setSkillsToLearn] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);
  const skillImageFileInputRef = useRef(null);

  // New skill form state (skills to teach)
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skillName: "",
    category: "technology",
    description: "",
    experienceLevel: "intermediate",
    image: null,
    imagePreview: null,
    overview: "",
    benefits: "",
    useCases: ""
  });

  // Skills to learn form state
  const [showLearnForm, setShowLearnForm] = useState(false);
  const [newLearnSkill, setNewLearnSkill] = useState({
    skillName: "",
    category: "technology",
    description: "",
    experienceLevel: "beginner"
  });

  // Portfolio form state (removed unused portfolio form to satisfy lint)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    // Learner fields
    learningGoals: "",
    // Mentor fields
    qualifications: [],
    certifications: [],
    yearsOfExperience: "",
    areasOfExpertise: [],
    teachingStyle: "",
  });

  const [newQualification, setNewQualification] = useState("");
  const [newCertification, setNewCertification] = useState({
    name: "",
    image: null,
    imagePreview: null
  });
  const [newExpertise, setNewExpertise] = useState("");

  // Request session modal state (for viewing mentor profile)
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Availability & Reviews state
  const availability = user?.availability || [];
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });


  const fetchMentorData = useCallback(async (mentorId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/users/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch mentor data");

      const data = await response.json();
      setUser(data);
      setViewingMode(true);
    } catch (err) {
      console.error("Error fetching mentor:", err);
      setError("Failed to load mentor profile");
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setViewingMode]);

  const fetchMentorSkills = useCallback(async (mentorId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/skills?user=${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch mentor skills");

      const data = await response.json();
      setSkills(data);
    } catch (err) {
      console.error("Error fetching mentor skills:", err);
    }
  }, [setSkills]);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch user data");

      const data = await response.json();
      setUser(data);
      setSkillsToLearn(data.skillsToLearn || []);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        bio: data.bio || "",
        learningGoals: data.learningGoals || "",
        qualifications: data.qualifications || [],
        certifications: data.certifications || [],
        yearsOfExperience: data.yearsOfExperience || "",
        areasOfExpertise: data.areasOfExpertise || [],
        teachingStyle: data.teachingStyle || "",
      });
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load profile");
      setIsLoading(false);
    }
  }, [navigate]);

  const fetchSkills = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/skills/my-skills", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSkills(data);
      }
    } catch (err) {
      console.error("Error fetching skills:", err);
    }
  }, []);

  const fetchUserReviews = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/users/reviews/${user?._id || "me"}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  }, [user?._id]);

  const fetchMentorReviews = useCallback(async (mentorId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/users/reviews/${mentorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching mentor reviews:", err);
    }
  }, []);

  useEffect(() => {
    if (viewingMentorId) {
      fetchMentorData(viewingMentorId);
      fetchMentorSkills(viewingMentorId);
      fetchMentorReviews(viewingMentorId);
    } else {
      fetchUserData();
      fetchSkills();
      fetchUserReviews();
    }
  }, [viewingMentorId, fetchMentorData, fetchMentorSkills, fetchMentorReviews, fetchUserData, fetchSkills, fetchUserReviews]);

  const handleAddReview = async () => {
    if (!newReview.comment.trim()) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/users/reviews/${viewingMentorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newReview)
      });

      if (response.ok) {
        await response.json();
        fetchMentorReviews(viewingMentorId);
        setNewReview({ rating: 5, comment: "" });
        setShowReviewForm(false);
      }
    } catch (err) {
      console.error("Error adding review:", err);
      setError("Failed to add review");
    }
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUser(data.user);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
    setIsSaving(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName.trim()) return;

    const token = localStorage.getItem("token");

    try {
      const skillData = {
        skillName: newSkill.skillName,
        category: newSkill.category,
        description: newSkill.description,
        experienceLevel: newSkill.experienceLevel,
        image: newSkill.imagePreview,
        overview: newSkill.overview,
        benefits: newSkill.benefits,
        useCases: newSkill.useCases
      };

      const response = await fetch("/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      });

      if (!response.ok) {
        throw new Error("Failed to add skill");
      }

      const data = await response.json();
      setSkills([...skills, data.skill]);
      setNewSkill({
        skillName: "",
        category: "technology",
        description: "",
        experienceLevel: "intermediate",
        image: null,
        imagePreview: null,
        overview: "",
        benefits: "",
        useCases: ""
      });
      setShowSkillForm(false);
    } catch (err) {
      console.error("Error adding skill:", err);
      setError("Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skillId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`/api/skills/${skillId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to remove skill");
      }

      setSkills(skills.filter(s => s._id !== skillId));
    } catch (err) {
      console.error("Error removing skill:", err);
      setError("Failed to remove skill");
    }
  };

  // Handle adding skill to learn
  const handleAddSkillToLearn = async () => {
    if (!newLearnSkill.skillName.trim()) return;

    const token = localStorage.getItem("token");
    const updatedSkillsToLearn = [...skillsToLearn, { ...newLearnSkill, _id: Date.now().toString() }];

    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ skillsToLearn: updatedSkillsToLearn })
      });

      if (!response.ok) {
        throw new Error("Failed to add skill to learn");
      }

      const data = await response.json();
      setSkillsToLearn(data.user.skillsToLearn || []);
      setNewLearnSkill({
        skillName: "",
        category: "technology",
        description: "",
        experienceLevel: "beginner"
      });
      setShowLearnForm(false);
    } catch (err) {
      console.error("Error adding skill to learn:", err);
      setError("Failed to add skill to learn");
    }
  };

  // Handle removing skill to learn
  const handleRemoveSkillToLearn = async (skillId) => {
    const token = localStorage.getItem("token");
    const updatedSkillsToLearn = skillsToLearn.filter(s => s._id !== skillId);

    try {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ skillsToLearn: updatedSkillsToLearn })
      });

      if (!response.ok) {
        throw new Error("Failed to remove skill to learn");
      }

      const data = await response.json();
      setSkillsToLearn(data.user.skillsToLearn || []);
    } catch (err) {
      console.error("Error removing skill to learn:", err);
      setError("Failed to remove skill to learn");
    }
  };

  // Handle adding qualification
  const handleAddQualification = () => {
    if (!newQualification.trim()) return;
    const updated = [...formData.qualifications, newQualification];
    setFormData({ ...formData, qualifications: updated });
    setNewQualification("");
  };

  const handleRemoveQualification = (index) => {
    const updated = formData.qualifications.filter((_, i) => i !== index);
    setFormData({ ...formData, qualifications: updated });
  };

  // Handle adding certification
  const handleAddCertification = () => {
    if (!newCertification.name.trim()) return;
    const updated = [...formData.certifications, { name: newCertification.name, image: newCertification.imagePreview }];
    setFormData({ ...formData, certifications: updated });
    setNewCertification({ name: "", image: null, imagePreview: null });
  };

  const handleRemoveCertification = (index) => {
    const updated = formData.certifications.filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: updated });
  };

  // Handle certificate image upload
  const handleCertificateImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewCertification({
        ...newCertification,
        image: file,
        imagePreview: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle skill image upload
  const handleSkillImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be less than 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewSkill({
        ...newSkill,
        image: file,
        imagePreview: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle adding expertise
  const handleAddExpertise = () => {
    if (!newExpertise.trim()) return;
    const updated = [...formData.areasOfExpertise, newExpertise];
    setFormData({ ...formData, areasOfExpertise: updated });
    setNewExpertise("");
  };

  const handleRemoveExpertise = (index) => {
    const updated = formData.areasOfExpertise.filter((_, i) => i !== index);
    setFormData({ ...formData, areasOfExpertise: updated });
  };

  // Portfolio handlers removed (UI not present in this view)

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be less than 3MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        const response = await fetch("/api/users/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ photo: base64Image })
        });

        if (!response.ok) {
          throw new Error("Failed to update profile photo");
        }

        const data = await response.json();
        setUser(data.user);
        setIsUploading(false);
      };

      reader.onerror = () => {
        setError("Failed to read image file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Failed to upload photo. Please try again.");
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => { setError(""); fetchUserData(); fetchSkills(); }}
            className="mt-4 text-primary hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isMentor = user?.role === "mentor";
  const isLearner = user?.role === "learner";

  return (
    <div className="pt-24 pb-12 max-w-7xl mx-auto px-6">
      {/* Role Badge */}
      <div className="mb-6 flex justify-end">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          isMentor 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {isMentor ? '👨‍🏫 Mentor' : '👨‍🎓 Learner'}
        </span>
      </div>
      <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 p-8 mb-8 border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="relative group">
            {user?.photo ? (
              <img
                src={user.photo}
                className="h-40 w-40 rounded-3xl object-cover border-4 border-white shadow-lg"
                alt="user"
              />
            ) : (
              <div className="h-40 w-40 rounded-3xl border-4 border-white shadow-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-5xl font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            {!viewingMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="text-white text-center">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium">Change Photo</span>
                  </div>
                )}
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {user?.name || "User"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Online
                  </span>
                </div>
                
                <p className="text-gray-600 max-w-xl mb-4">
                  {user?.bio || "Looking to exchange skills and grow together."}
                </p>
              </>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-6">
              <div className="text-center px-4">
                <div className="text-2xl font-bold text-primary">{user?.rating?.toFixed(1) || 0}</div>
                <div className="text-sm text-gray-500">Rating</div>
              </div>
              {isMentor && (
                <>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-blue-600">{skills.length}</div>
                    <div className="text-sm text-gray-500">Skills</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-purple-600">{user?.yearsOfExperience || 0}</div>
                    <div className="text-sm text-gray-500">Years Experience</div>
                  </div>
                </>
              )}
              {isLearner && (
                <>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-green-600">{skillsToLearn.length}</div>
                    <div className="text-sm text-gray-500">Skills to Learn</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-purple-600">{user?.sessionsCompleted || 0}</div>
                    <div className="text-sm text-gray-500">Sessions</div>
                  </div>
                </>
              )}
              <div className="text-center px-4">
                <div className="text-2xl font-bold text-indigo-600">{user?.trustScore || 0}</div>
                <div className="text-sm text-gray-500">Trust Score</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {!viewingMode ? (
                <>
                  <button 
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit Profile"}
                  </button>

                  {isEditing && (
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user?.name || "",
                          email: user?.email || "",
                          bio: user?.bio || "",
                          learningGoals: user?.learningGoals || "",
                          qualifications: user?.qualifications || [],
                          certifications: user?.certifications || [],
                          yearsOfExperience: user?.yearsOfExperience || "",
                          areasOfExpertise: user?.areasOfExpertise || [],
                          teachingStyle: user?.teachingStyle || "",
                        });
                      }}
                      className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate(-1)}
                    className="bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    ← Back
                  </button>
                  
                  {isMentor && (
                    <button 
                      onClick={() => {
                        setShowRequestModal(true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Request Session
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MENTOR SPECIFIC SECTIONS */}
      {isMentor && (
        <>
          {/* Professional Information */}
          <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 p-6 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
              Professional Information
            </h3>

            {isEditing ? (
              <div className="space-y-6">
                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                {/* Teaching Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Style / Description</label>
                  <textarea
                    value={formData.teachingStyle}
                    onChange={(e) => setFormData({...formData, teachingStyle: e.target.value})}
                    placeholder="Describe your teaching approach and style..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      placeholder="e.g., Bachelor's in Computer Science"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddQualification()}
                    />
                    <button
                      onClick={handleAddQualification}
                      className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.qualifications.length > 0 && (
                    <div className="space-y-2">
                      {formData.qualifications.map((qual, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-primary/5 p-3 rounded-lg">
                          <span className="text-gray-700">{qual}</span>
                          <button
                            onClick={() => handleRemoveQualification(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    <span className="inline-block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Certifications</span>
                  </label>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Certification Name</label>
                        <input
                          type="text"
                          value={newCertification.name}
                          onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
                          placeholder="e.g., AWS Certified Solutions Architect"
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Image (Optional)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => certFileInputRef.current?.click()}
                            className="flex-1 px-4 py-2 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer text-sm font-medium text-blue-700"
                          >
                            {newCertification.imagePreview ? '✓ Image Selected' : '📸 Upload Certificate Image'}
                          </button>
                          <input
                            ref={certFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCertificateImageUpload}
                            className="hidden"
                          />
                        </div>
                        {newCertification.imagePreview && (
                          <div className="mt-2 relative">
                            <img 
                              src={newCertification.imagePreview} 
                              alt="Certificate preview" 
                              className="h-20 w-20 object-cover rounded-lg border-2 border-blue-300"
                            />
                            <button
                              type="button"
                              onClick={() => setNewCertification({...newCertification, image: null, imagePreview: null})}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={handleAddCertification}
                        disabled={!newCertification.name.trim()}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                      >
                        + Add Certification
                      </button>
                    </div>
                  </div>
                  
                  {formData.certifications.length > 0 && (
                    <div className="space-y-3">
                      {formData.certifications.map((cert, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 hover:border-blue-300 transition group"
                        >
                          {cert.image && (
                            <img 
                              src={cert.image} 
                              alt={cert.name} 
                              className="h-16 w-16 object-cover rounded-md flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-gray-800 font-medium">{cert.name}</p>
                            {cert.image && <p className="text-xs text-gray-500 mt-1">📎 Certificate image attached</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveCertification(idx)}
                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Areas of Expertise */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="e.g., Web Development"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                    />
                    <button
                      onClick={handleAddExpertise}
                      className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.areasOfExpertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.areasOfExpertise.map((expertise, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                          <span className="text-sm text-gray-700">{expertise}</span>
                          <button
                            onClick={() => handleRemoveExpertise(idx)}
                            className="text-red-500 hover:text-red-700 text-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Years of Experience</p>
                  <p className="text-2xl font-bold text-blue-600">{user?.yearsOfExperience || "Not specified"}</p>
                </div>
                {user?.teachingStyle && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:border-purple-400 transition">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Teaching Style</p>
                    <p className="text-gray-900 leading-relaxed">{user.teachingStyle}</p>
                  </div>
                )}
                {user?.qualifications?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-3">Qualifications</p>
                    <div className="space-y-2">
                      {user.qualifications.map((qual, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 flex items-center gap-2 hover:border-purple-400 transition">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span className="text-gray-700 font-medium">{qual}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {user?.certifications?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Certifications</p>
                    <div className="space-y-3">
                      {user.certifications.map((cert, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:border-blue-400 transition flex items-start gap-3">
                          {typeof cert === 'object' && cert.imagePreview && (
                            <img 
                              src={cert.imagePreview} 
                              alt={cert.name} 
                              className="h-20 w-20 object-cover rounded-lg flex-shrink-0 shadow-sm border border-blue-100"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-gray-800 font-semibold">{typeof cert === 'string' ? cert : cert.name}</p>
                            {typeof cert === 'object' && cert.imagePreview && (
                              <p className="text-xs text-blue-600 mt-1">📎 Certificate image attached</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {user?.areasOfExpertise?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-3">Areas of Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {user.areasOfExpertise.map((expertise, idx) => (
                        <span key={idx} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-600/30 transition">
                          {expertise}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Skills Section (Mentor) */}
      <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            My Skills
          </h3>
          <button
            onClick={() => setShowSkillForm(!showSkillForm)}
            className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Skill
          </button>
        </div>

        {/* Add Skill Form */}
        {showSkillForm && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              Add New Skill (I can teach)
            </h4>
            
            {/* Basic Info Row */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name *</label>
                <input
                  type="text"
                  value={newSkill.skillName}
                  onChange={(e) => setNewSkill({...newSkill, skillName: e.target.value})}
                  placeholder="e.g., JavaScript, Photography"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({...newSkill, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="technology">Technology</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="language">Language</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
                <select
                  value={newSkill.experienceLevel}
                  onChange={(e) => setNewSkill({...newSkill, experienceLevel: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({...newSkill, description: e.target.value})}
                  placeholder="Brief description"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Skill Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill Image (Optional)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => skillImageFileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-white border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer text-sm font-medium text-blue-700"
                >
                  {newSkill.imagePreview ? '✓ Image Selected' : '🖼️ Upload Skill Image'}
                </button>
                <input
                  ref={skillImageFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSkillImageUpload}
                  className="hidden"
                />
              </div>
              {newSkill.imagePreview && (
                <div className="mt-2 relative">
                  <img 
                    src={newSkill.imagePreview} 
                    alt="Skill preview" 
                    className="h-24 w-32 object-cover rounded-lg border-2 border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => setNewSkill({...newSkill, image: null, imagePreview: null})}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Detailed Info */}
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overview (What students learn)</label>
                <textarea
                  value={newSkill.overview}
                  onChange={(e) => setNewSkill({...newSkill, overview: e.target.value})}
                  placeholder="What is this skill about? What will students learn?"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (Why learn this)</label>
                <textarea
                  value={newSkill.benefits}
                  onChange={(e) => setNewSkill({...newSkill, benefits: e.target.value})}
                  placeholder="High-paying jobs, freelancing opportunities, career growth..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Use Cases (Real-world applications)</label>
                <textarea
                  value={newSkill.useCases}
                  onChange={(e) => setNewSkill({...newSkill, useCases: e.target.value})}
                  placeholder="Building websites, SaaS products, startups, e-commerce platforms..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddSkill}
                disabled={!newSkill.skillName.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              >
                Save Skill
              </button>
              <button
                onClick={() => {
                  setShowSkillForm(false);
                  setNewSkill({
                    skillName: "",
                    category: "technology",
                    description: "",
                    experienceLevel: "intermediate",
                    image: null,
                    imagePreview: null,
                    overview: "",
                    benefits: "",
                    useCases: ""
                  });
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reviews & Ratings Section */}
        <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 p-6 border border-gray-100 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-yellow-500 rounded-full"></span>
            Reviews & Ratings
          </h3>

          <div className="mb-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-1">
                  {user?.rating?.toFixed(1) || "N/A"}
                </div>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(user?.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Based on <span className="font-bold text-gray-900">{reviews.length}</span> reviews</p>
                <p className="text-xs text-gray-500 mt-1">Last review: {reviews.length > 0 ? new Date(reviews[0].createdAt).toLocaleDateString() : "No reviews yet"}</p>
              </div>
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {review.fromUser?.photo && (
                          <img
                            src={review.fromUser.photo}
                            alt={review.fromUser?.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{review.fromUser?.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No reviews yet.{viewingMode ? " Be the first to leave a review!" : ""}</p>
              </div>
            )}

            {/* Review Form (only show when viewing someone else's profile) */}
            {viewingMode && !isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {showReviewForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setNewReview({ ...newReview, rating })}
                            className="text-3xl transition-colors"
                          >
                            <span className={newReview.rating >= rating ? "text-yellow-400" : "text-gray-300"}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="Share your experience..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddReview}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 font-medium"
                  >
                    Leave a Review
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Availability Schedule Section (for mentors) */}
        {isMentor && (
          <div className="bg-white rounded-3xl shadow-lg shadow-primary/5 p-6 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-green-600 rounded-full"></span>
              Availability Schedule
            </h3>

            <div className="space-y-4">
              {availability.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availability.map((slot, idx) => (
                    <div key={idx} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <p className="font-semibold text-gray-900 capitalize">{slot.day}</p>
                      <p className="text-sm text-gray-600 mt-1">⏰ {slot.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  {viewingMode ? "No availability information available." : "No availability set. Add your schedule in your dashboard."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Skills List */}
        {skills.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div
                key={skill._id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* Skill Image */}
                {skill.image && (
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    <img 
                      src={skill.image} 
                      alt={skill.skillName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                {/* Skill Content */}
                <div className="p-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{skill.skillName}</h4>
                      <span className="text-xs text-white bg-primary px-2 py-1 rounded-full capitalize inline-block">
                        {skill.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill._id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Level Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Experience:</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded capitalize">
                      {skill.experienceLevel}
                    </span>
                  </div>

                  {/* Overview */}
                  {skill.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{skill.description}</p>
                  )}

                  {/* Overview Section */}
                  {skill.overview && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-gray-700"><span className="font-semibold text-blue-700">Overview:</span> {skill.overview}</p>
                    </div>
                  )}

                  {/* Benefits */}
                  {skill.benefits && (
                    <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs text-gray-700"><span className="font-semibold text-green-700">Benefits:</span> {skill.benefits}</p>
                    </div>
                  )}

                  {/* Use Cases */}
                  {skill.useCases && (
                    <div className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs text-gray-700"><span className="font-semibold text-purple-700">Use Cases:</span> {skill.useCases}</p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                    Updated: {new Date(skill.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-gray-500">No skills added yet. Add your first skill!</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* LEARNER SPECIFIC SECTIONS */}
      {isLearner && (
        <>
          {/* Learner Profile Details Section */}
          <div className="bg-white rounded-3xl shadow-lg shadow-green-500/5 p-6 border border-gray-100 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-8 bg-green-600 rounded-full"></span>
              My Learning Profile
            </h3>

            {isEditing ? (
              <div className="space-y-6">
                {/* Learning Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Goals</label>
                  <textarea
                    value={formData.learningGoals}
                    onChange={(e) => setFormData({...formData, learningGoals: e.target.value})}
                    placeholder="What are your learning goals? What do you want to achieve?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Learning Goals Display */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Learning Goals
                  </p>
                  <p className="text-gray-900 leading-relaxed">
                    {user?.learningGoals || "No learning goals set yet. Add your goals to guide your learning journey."}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Sessions Completed
                    </p>
                    <p className="text-2xl font-bold text-purple-600">{user?.sessionsCompleted || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
                    <p className="text-sm text-gray-600 font-semibold mb-1 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Ratings Received
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-yellow-600">{user?.rating?.toFixed(1) || "0"}</p>
                      <span className="text-sm text-gray-500">/ 5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Skills I Want to Learn Section */}
          <div className="bg-white rounded-3xl shadow-lg shadow-purple-500/5 p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
            Skills I Want to Learn
          </h3>
          <button
            onClick={() => setShowLearnForm(!showLearnForm)}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Skill to Learn
          </button>
        </div>

        {/* Add Skill to Learn Form */}
        {showLearnForm && (
          <div className="bg-purple-50 rounded-2xl p-6 mb-6 border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-4">Add Skill I Want to Learn</h4>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skill Name</label>
                <input
                  type="text"
                  value={newLearnSkill.skillName}
                  onChange={(e) => setNewLearnSkill({...newLearnSkill, skillName: e.target.value})}
                  placeholder="e.g., Python, Guitar, French"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newLearnSkill.category}
                  onChange={(e) => setNewLearnSkill({...newLearnSkill, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  <option value="technology">Technology</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="language">Language</option>
                  <option value="music">Music</option>
                  <option value="art">Art</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desired Level</label>
                <select
                  value={newLearnSkill.experienceLevel}
                  onChange={(e) => setNewLearnSkill({...newLearnSkill, experienceLevel: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newLearnSkill.description}
                  onChange={(e) => setNewLearnSkill({...newLearnSkill, description: e.target.value})}
                  placeholder="What do you want to learn?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddSkillToLearn}
                disabled={!newLearnSkill.skillName.trim()}
                className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
              >
                Save Skill
              </button>
              <button
                onClick={() => setShowLearnForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skills to Learn List */}
        {skillsToLearn.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsToLearn.map((skill) => (
              <div
                key={skill._id}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{skill.skillName}</h4>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full capitalize">
                      {skill.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveSkillToLearn(skill._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Desired Level:</span> {skill.experienceLevel}
                </div>
                {skill.description && (
                  <p className="text-sm text-gray-500">{skill.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500">No skills to learn yet. Add skills you want to learn!</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Logout - Only show when viewing own profile */}
      {!viewingMode && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}

      {/* Request Session Modal (for viewing mentor profile) */}
      {showRequestModal && viewingMode && isMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Request Session
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Request a mentoring session with <span className="font-semibold">{user?.name}</span>
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowRequestModal(false);
              // You can integrate actual session booking logic here
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Skill *
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Choose a skill to learn</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill.skillName}>
                      {skill.skillName} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time *
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

