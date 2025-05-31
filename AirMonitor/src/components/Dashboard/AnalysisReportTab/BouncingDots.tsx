"use client";

import React from "react";

export function BouncingDots() {
  return (
    <span className="inline-flex items-baseline space-x-1">
      <span
        className="inline-block text-gray-500 animate-bounce"
        style={{ animationDelay: "0ms" }}
      >
        .
      </span>
      <span
        className="inline-block text-gray-500 animate-bounce"
        style={{ animationDelay: "200ms" }}
      >
        .
      </span>
      <span
        className="inline-block text-gray-500 animate-bounce"
        style={{ animationDelay: "400ms" }}
      >
        .
      </span>
    </span>
  );
}
