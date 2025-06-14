import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

export default function ConsultantLayout() {
  const navigate = useNavigate();

  // Kiểm tra role consultant, nếu không phải thì chuyển về trang login
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "CONSULTANT") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex-1 p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
