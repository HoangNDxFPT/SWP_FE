import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";

export default function ConsultantLayout() {
  

  // Kiểm tra role consultant, nếu không phải thì chuyển về trang login
  useEffect(() => {
    // Lấy user object từ localStorage
    const userStr = localStorage.getItem("user");
    
    try {
      // Parse JSON nếu có
      const userData = userStr ? JSON.parse(userStr) : null;
      
      // Lấy role từ cấu trúc user object
      const role = userData?.role || 
                  (userData?.user && userData?.user.role);
      
      console.log("Current user data:", userData);
      console.log("Detected role:", role);
      
      if (role !== "CONSULTANT") {
        console.log("Not a CONSULTANT, redirecting to login");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
      window.location.href = "/login"; 
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="flex-1  bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}