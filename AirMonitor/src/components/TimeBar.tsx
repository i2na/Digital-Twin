"use client";

import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";

export default function TimeBar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const dateString = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });

  const hours = now.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const timeString = `${ampm} ${hour12.toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  return (
    <div className="absolute top-4 right-4 z-30 pointer-events-auto rounded-xl px-5 py-2 flex items-center space-x-3 glass-block">
      <FiClock className="text-gray-600 w-5 h-5" />
      <span className="text-black text-[17px] font-semibold">
        {dateString} <span className="text-gray-400 font-normal">/</span>{" "}
        <span className="font-bold">{timeString}</span>
      </span>
    </div>
  );
}
