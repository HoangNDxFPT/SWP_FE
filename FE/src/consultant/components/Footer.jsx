import React from "react";

function Footer() {
  return (
    <footer className="w-full bg-gray-100 border-t border-gray-300 py-6 mt-8">
      <div className="w-full px-4">
        <hr className="mb-4 border-gray-300" />
        <div className="text-center text-gray-700 text-sm">
          © 2006–{new Date().getFullYear()} Foundation for a Drug-Free World.
          All Rights Reserved. The Foundation for a Drug-Free World Logo is a
          trademark owned by the Foundation for a Drug-Free World.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
