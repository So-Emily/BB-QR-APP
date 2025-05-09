import React from "react";
import { useSession } from "next-auth/react";

const capitalizeName = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const UserProfile = () => {
  const { data: session } = useSession();
  const userName = session?.user?.name ? capitalizeName(session.user.name) : "Guest";

  return (
    <div className="rounded-lg p-4 flex flex-col items-center w-64">
      <img 
        src="/images/gallo2.png" 
        alt="User Profile"
        className="w-30 h-32 rounded-full object-cover shadow-md"
      />
      <h1 className="text-3xl font-medium mt-4">{userName}</h1>
    </div>
  );
};

export default UserProfile;