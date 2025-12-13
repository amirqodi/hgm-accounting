"use client";

import React from "react";
import Notif from "./Notif";
import DateTime from "./DateTime";
import Prices from "./Prices";
import { useUser } from "@/hooks/useUser";

const NavBar = () => {
  const { user, loading } = useUser();

  return (
    <nav className="w-full bg-primary p-3 pr-16 text-white shadow-accent relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Notif />
          <span>{loading ? "..." : user ? user.username : "مهمان"}</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2">
          <DateTime />
        </div>

        <div>
          <Prices />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
