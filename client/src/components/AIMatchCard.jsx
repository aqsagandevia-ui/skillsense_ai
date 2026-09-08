import React from "react";

const AIMatchCard = ({ user, skill, matchScore }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <h3 className="font-bold">{user}</h3>
      <p>Skill: {skill}</p>
      <p>Match Score: {matchScore}%</p>
    </div>
  );
};

export default AIMatchCard;
