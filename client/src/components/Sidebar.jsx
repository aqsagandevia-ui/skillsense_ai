import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Matches", path: "/matches" },
    { name: "Sessions", path: "/sessions" },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen p-5 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Menu</h2>
      {menu.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`block py-2 px-4 rounded hover:bg-gray-700 ${
            location.pathname === item.path ? "bg-gray-700" : ""
          }`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
