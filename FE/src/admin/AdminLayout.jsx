import React, { useRef, useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/features/userSlice"; // Điều chỉnh đường dẫn
import { persistor } from "../redux/store";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef();

  // Kiểm tra role admin, nếu không phải thì chuyển về trang login
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      window.location.href = "/login";
    }
  }, []);

  const menu = [
    { label: "Dashboard", path: "/admin" },
    { label: "Account Management", path: "/admin/users" },
    { label: "Course Management", path: "/admin/courses" },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fullName = localStorage.getItem('full_name') || "User";

  const handleLogout = () => {
    // Dispatch logout action để xóa user từ Redux store
    dispatch(logout());
    // Xóa persisted state để không ghi nhớ user
    persistor.purge();
    // Xóa localStorage tokens và các data khác
    localStorage.clear();
    // Chuyển hướng về trang login
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-900 text-white flex flex-col py-6 px-4">
          <div className="text-2xl font-bold mb-8 text-center tracking-widest">ADMIN PANEL</div>
          <ul className="flex-1 space-y-2">
            {menu.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block px-4 py-2 rounded transition ${location.pathname === item.path
                    ? "bg-blue-700 font-semibold"
                    : "hover:bg-blue-800"
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-end bg-white shadow px-8 py-4">
            <div className="relative flex items-center gap-4" ref={menuRef}>
              {/* User dropdown */}
              <button
                className="flex items-center gap-2 text-gray-700 font-semibold focus:outline-none"
                onClick={() => setOpenMenu((v) => !v)}
              >
                <span>Hello, {fullName}!</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu && (
                <div className="absolute right-0 top-10 z-50 bg-white border rounded shadow min-w-[150px]">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setOpenMenu(false);
                      navigate("/admin/profile");
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 p-8 bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}