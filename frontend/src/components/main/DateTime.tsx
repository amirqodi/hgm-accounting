"use client";

import React, { useState, useEffect } from "react";
import { FaRegCalendarAlt, FaRegClock } from "react-icons/fa";

const DateTime: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = now.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-4 text-white">
      <span className="flex items-center gap-2">
        {time}
        <FaRegClock className="text-lg" />
      </span>
      <span className="flex items-center gap-2">
        {date}
        <FaRegCalendarAlt className="text-lg" />
      </span>
    </div>
  );
};

export default DateTime;
