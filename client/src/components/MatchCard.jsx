import React from "react";

const MatchCard = ({ user, skill }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <h3 className="font-bold">{user}</h3>
      <p>Skill: {skill}</p>
    </div>
  );
};

export default MatchCard;
