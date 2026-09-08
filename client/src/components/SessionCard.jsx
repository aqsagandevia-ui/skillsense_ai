import React from "react";

const SessionCard = ({ user, skill, status }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition">
      <h3 className="font-bold">{user}</h3>
      <p>Skill: {skill}</p>
      <p>Status: {status}</p>
    </div>
  );
};

export default SessionCard;
