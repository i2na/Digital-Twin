"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";

interface RoomSelectDropdownProps {
  rooms: string[];
  value: string | null;
  onChange: (room: string) => void;
}

export function RoomSelectDropdown({
  rooms,
  value,
  onChange,
}: RoomSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center bg-transparent text-lg font-bold text-black cursor-pointer focus:outline-none"
      >
        {value ? `${value}호` : "방 선택"}
        <FiChevronDown className="ml-2 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-10 top-[32px] mt-2 right-0 w-[96px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadein">
          {rooms.map((r) => (
            <button
              key={r}
              className={`w-full text-left px-4 py-2 text-base hover:bg-gray-100 ${
                r === value ? "bg-gray-100 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              {r}호
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
