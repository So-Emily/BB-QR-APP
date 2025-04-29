import React from "react";

const UserProfile = () => {
  return (
    <div className="rounded-lg p-6 flex flex-col items-center w-64">
      <img 
        src="/images/gallo2.png" 
        alt="User Profile"
        className="w-70 h-70 rounded-full object-cover shadow-md"
      />
      <h2 className="text-lg font-bold mt-4"></h2>
      <h1 className="text-3xl font-medium">Gallo</h1>
    </div>
  );
};

export default UserProfile;
