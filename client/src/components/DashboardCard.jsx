import React from "react";

const DashboardCard = ({ title, count, color }) => {
  return (
    <div className={`p-4 rounded-lg shadow-lg bg-${color}-500 text-white`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl mt-2">{count}</p>
    </div>
  );
};

export default DashboardCard;
    