import React from "react";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white text-center py-4 shadow-inner border-t border-blue-800">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
        <span className="font-semibold tracking-wide text-lg">Admin Panel</span>
        <span className="text-sm mt-2 md:mt-0">
          © 2025 Drug Use Prevention Support System
        </span>
      </div>
    </footer>
  );
}