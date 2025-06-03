"use client";

import React from "react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  text = "Se încarcă...",
  size = "md",
}: LoadingSpinnerProps) {
  const spinnerSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${spinnerSizes[size]} animate-spin rounded-full border-4 border-t-transparent border-blue-600`}
      ></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
}
