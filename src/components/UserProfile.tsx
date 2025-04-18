import React from "react";

const UserProfile = () => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center w-64">
      <img 
        src="/images/gallo2.png" 
        alt="User Profile"
        className="w-40 h-40 rounded-full object-cover shadow-md"
      />
      <h2 className="text-lg font-bold mt-4"></h2>
    </div>
  );
};

export default UserProfile;
