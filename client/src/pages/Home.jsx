// import { Link } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
// import { useEffect } from "react";
// import { useLocation } from "react-router-dom";

// const skills = [
//   {
//     title: "Web Development",
//     wants: "UI/UX Design",
//     image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80",
//     users: 120,
//     color: "from-blue-500 to-cyan-500"
//   },
//   {
//     title: "Graphic Design",
//     wants: "SEO Marketing",
//     image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80",
//     users: 85,
//     color: "from-purple-500 to-pink-500"
//   },
//   {
//     title: "Video Editing",
//     wants: "Content Writing",
//     image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80",
//     users: 65,
//     color: "from-orange-500 to-red-500"
//   },
//   {
//     title: "Data Science",
//     wants: "Web Development",
//     image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
//     users: 95,
//     color: "from-green-500 to-emerald-500"
//   },
//   {
//     title: "Mobile Apps",
//     wants: "Backend Dev",
//     image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80",
//     users: 78,
//     color: "from-indigo-500 to-purple-500"
//   },
//   {
//     title: "Photography",
//     wants: "Photoshop",
//     image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&q=80",
//     users: 52,
//     color: "from-pink-500 to-rose-500"
//   }
// ];

// const features = [
//   {
//     icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
//     title: "Learn New Skills",
//     description: "Connect with experts and learn skills that matter to you."
//   },
//   {
//     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
//     title: "Build Network",
//     description: "Meet like-minded people and grow your professional network."
//   },
//   {
//     icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
//     title: "Free Exchange",
//     description: "No money involved. Pure skill-for-skill exchange."
//   }
// ];

// export default function Home() {

//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (location.hash) {
//       const el = document.getElementById(location.hash.replace("#", ""));
//       if (el) {
//         el.scrollIntoView({ behavior: "smooth" });
//       }
//     }
//   }, [location]);
//   return (
//     <div className="pt-16">
//       {/* HERO SECTION */}
//       <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
//         {/* Background decoration */}
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
//           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
//         </div>

//         <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-28">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             {/* Left Content */}
//             <div className="animate-fade-in">
//               <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
//                 <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
//                 Start Learning Today
//               </div>

//               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
//                 Learn by <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Sharing</span>
//                 <br />
//                 Grow by <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Swapping</span>
//               </h1>

//               <p className="mt-6 text-gray-600 text-lg max-w-xl">
//                 Exchange skills with real people worldwide. No money. Just pure learning through collaboration and knowledge sharing.
//               </p>

//               <div className="mt-8 flex flex-wrap gap-4">
//                 <Link
//                   to="/register"
//                   className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
//                 >
//                   Start Swapping
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                   </svg>
//                 </Link>
//                 <Link
//                   to="/browse"
//                   className="inline-flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold border-2 border-gray-100 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
//                 >
//                   Explore Skills
//                 </Link>
//               </div>

//               {/* Trust indicators */}
//               <div className="mt-10 flex items-center gap-6">
//                 <div className="flex -space-x-3">
//                   {[1, 2, 3, 4, 5].map((i) => (
//                     <img
//                       key={i}
//                       src={`https://i.pravatar.cc/40?img=${i + 10}`}
//                       alt="User"
//                       className="w-10 h-10 rounded-full border-2 border-white"
//                     />
//                   ))}
//                 </div>
//                 <div>
//                   <div className="font-semibold text-gray-900">1,000+ Happy Users</div>
//                   <div className="text-sm text-gray-500">Join our community</div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Content - Illustration */}
//             <div className="relative animate-slide-in">
//               <div className="relative">
//                 <img
//                   src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
//                   alt="People learning together"
//                   className="rounded-3xl shadow-2xl w-full object-cover"
//                 />
//                 {/* Floating cards */}
//                 <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
//                       <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                     </div>
//                     <div>
//                       <div className="font-semibold text-gray-900">Skill Matched!</div>
//                       <div className="text-sm text-gray-500">React → UI Design</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl">
//                   <div className="flex items-center gap-3">
//                     <div className="text-2xl">🎯</div>
//                     <div>
//                       <div className="font-semibold text-gray-900">98%</div>
//                       <div className="text-sm text-gray-500">Success Rate</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* FEATURES SECTION */}
//       <section className="py-20 bg-white">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
//               Why Choose SkillSwap?
//             </h2>
//             <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
//               We make skill exchange simple, fun, and rewarding for everyone involved.
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {features.map((feature, index) => (
//               <div
//                 key={index}
//                 className="group p-8 rounded-3xl bg-gray-50 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-emerald-50 transition-all duration-300 card-hover"
//               >
//                 <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
//                   <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
//                   </svg>
//                 </div>
//                 <h3 className="text-xl font-bold text-gray-900 mb-3">
//                   {feature.title}
//                 </h3>
//                 <p className="text-gray-600">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* STATS SECTION */}
//       <div className="bg-gradient-to-r from-primary to-indigo-600 py-16">
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//             {[
//               { label: "Skills Available", value: "500+", icon: "📚" },
//               { label: "Active Users", value: "1K+", icon: "👥" },
//               { label: "Swaps Completed", value: "300+", icon: "🔄" },
//               { label: "Categories", value: "20+", icon: "📁" },
//             ].map((item, i) => (
//               <div key={i} className="text-center">
//                 <div className="text-4xl mb-2">{item.icon}</div>
//                 <h3 className="text-4xl font-bold text-white">{item.value}</h3>
//                 <p className="text-white/80">{item.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* POPULAR SKILLS */}
//       <div id="popular-skills" className="max-w-7xl mx-auto px-6 py-20">
//         <div className="flex justify-between items-end mb-12">
//           <div id="popular-skills" className="max-w-7xl mx-auto px-6 py-20">
//             <h2 className="text-3xl font-bold text-gray-900">Popular Skills</h2>
//             <p className="text-gray-500 mt-2">Discover trending skill exchanges</p>
//           </div>
//           <Link
//             to="/browse"
//             className="hidden sm:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
//           >
//             View All
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
//             </svg>
//           </Link>
//         </div>

//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {skills.map((skill, i) => (
//             <div
//               key={i}
//               className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 card-hover"
//             >
//               <div className="relative h-48 overflow-hidden">
//                 <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
//                 <img
//                   src={skill.image}
//                   alt={skill.title}
//                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
//                 />
//                 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
//                   {skill.users} users
//                 </div>
//               </div>
//               <div className="p-5">
//                 <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
//                   {skill.title}
//                 </h3>
//                 <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
//                   <span className="text-secondary">↔</span> Wants: {skill.wants}
//                 </p>
//                 <button
//                   onClick={() =>
//                     navigate(`/skill/${encodeURIComponent(skill.title)}`, {
//                       state: { skill }
//                     })
//                   }
//                   className="mt-4 w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-2.5 rounded-xl"
//                 >
//                   Request Swap
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="mt-8 text-center sm:hidden">
//           <Link
//             to="/browse"
//             className="inline-flex items-center gap-2 text-primary font-semibold"
//           >
//             View All Skills
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
//             </svg>
//           </Link>
//         </div>
//       </div>

//       {/* CTA SECTION */}
//       <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
//         <div className="absolute inset-0">
//           <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
//         </div>
//         <div className="relative max-w-4xl mx-auto px-6 text-center">
//           <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
//             Ready to Start Your Skill Journey?
//           </h2>
//           <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
//             Join thousands of learners and educators who are already exchanging skills and growing together.
//           </p>
//           <div className="flex flex-wrap justify-center gap-4">
//             <Link
//               to="/register"
//               className="bg-white text-primary px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
//             >
//               Get Started Free
//             </Link>
//             <Link
//               to="/browse"
//               className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
//             >
//               Browse Skills
//             </Link>
//           </div>
//         </div>
//       </section>

//     </div>
//   );
// }


import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    title: "Learn New Skills",
    description: "Connect with experts and learn skills that matter to you."
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    title: "Build Network",
    description: "Meet like-minded people and grow your professional network."
  },
  {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Free Exchange",
    description: "No money involved. Pure skill-for-skill exchange."
  }
];

const skillGradients = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-emerald-500",
  "from-indigo-500 to-purple-500",
  "from-pink-500 to-rose-500"
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [popularSkills, setPopularSkills] = useState([]);
  const [stats, setStats] = useState({
    totalSkills: 0,
    activeUsers: 0,
    swapsCompleted: 0
  });
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    const fetchPopularSkills = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/skills?limit=6", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error("Failed to fetch skills");
        }

        const data = await response.json();
        const skillsList = data.skills || [];

        const groupedSkills = skillsList.reduce((acc, skill) => {
          const skillName = skill.skillName || skill.title;
          const existing = acc.find((item) => item.skillName === skillName);

          if (existing) {
            existing.mentors = existing.mentors || [existing];
            existing.mentors.push(skill);
          } else {
            acc.push({
              ...skill,
              skillName,
              mentors: [skill]
            });
          }

          return acc;
        }, []);

        const topSkills = groupedSkills.slice(0, 6).map((skill, index) => ({
          ...skill,
          title: skill.skillName,
          wants: skill.category ? skill.category.charAt(0).toUpperCase() + skill.category.slice(1) : "Skill exchange",
          users: skill.mentors?.length || 1,
          image:
            skill.image ||
            "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
          color: skillGradients[index % skillGradients.length]
        }));

        const uniqueUsers = new Set(
          skillsList
            .map((skill) => skill.user?._id || skill.user)
            .filter(Boolean)
        ).size;

        setPopularSkills(topSkills);
        setStats({
          totalSkills: data.pagination?.total || skillsList.length,
          activeUsers: uniqueUsers || Math.max(skillsList.length, 1),
          swapsCompleted: Math.max(30, Math.round((data.pagination?.total || skillsList.length) * 1.5))
        });
      } catch (err) {
        console.error("Error fetching popular skills:", err);
        setPopularSkills([]);
        setStats({
          totalSkills: 0,
          activeUsers: 0,
          swapsCompleted: 0
        });
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchPopularSkills();
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const handleRequestSwap = (skill) => {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate(`/skill/${encodeURIComponent(skill.title)}`, {
      state: {
        skill,
        allMentors: skill.mentors || [skill]
      }
    });
  };

  const statItems = [
    { label: "Skills Available", value: `${stats.totalSkills}+`, icon: "📚" },
    { label: "Active Users", value: `${stats.activeUsers}+`, icon: "👥" },
    { label: "Swaps Completed", value: `${stats.swapsCompleted}+`, icon: "🔄" },
    { label: "Categories", value: "8+", icon: "📁" }
  ];

  return (
    <div className="pt-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full font-medium text-sm mb-6 shadow-sm">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                Start Learning Today
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
                Learn by <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Sharing</span>
                <br />
                Grow by <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Swapping</span>
              </h1>

              <p className="mt-6 text-slate-600 text-lg max-w-xl">
                Exchange skills with real people worldwide. No money. Just pure learning through collaboration and knowledge sharing.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300"
                >
                  Start Swapping
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-2xl font-semibold border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Explore Skills
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i + 10}`}
                      alt="User"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{stats.activeUsers || 1000}+ Happy Users</div>
                  <div className="text-sm text-gray-500">Join our community</div>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-in">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80"
                  alt="People learning together"
                  className="rounded-3xl shadow-2xl w-full object-cover"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Skill Matched!</div>
                      <div className="text-sm text-gray-500">{popularSkills[0]?.title || "React"} → UI Design</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎯</div>
                    <div>
                      <div className="font-semibold text-gray-900">98%</div>
                      <div className="text-sm text-gray-500">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Why Choose SkillSense AI?
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              We make skill exchange simple, fun, and rewarding for everyone involved.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl border border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statItems.map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm">
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="text-4xl font-bold text-white">{item.value}</h3>
                <p className="text-white/80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="popular-skills" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Popular Skills</h2>
            <p className="text-slate-500 mt-2">Discover trending skill exchanges</p>
          </div>
          <Link
            to="/browse"
            className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all"
          >
            View All
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {loadingSkills ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : popularSkills.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularSkills.map((skill, i) => (
              <div
                key={`${skill.title}-${i}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-indigo-200"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                  <img
                    src={skill.image}
                    alt={skill.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                    {skill.users} users
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {skill.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <span className="text-violet-600">↔</span> {skill.wants}
                  </p>
                  <button
                    onClick={() => handleRequestSwap(skill)}
                    className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    Request Swap
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl text-gray-600">
            No skill listings are available yet. Create one in the dashboard to populate this section.
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 text-primary font-semibold"
          >
            View All Skills
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Skill Journey?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of learners and educators who are already exchanging skills and growing together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-primary px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Free
            </Link>
            <Link
              to="/browse"
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
            >
              Browse Skills
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}