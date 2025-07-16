import React, { useRef, useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../config/axios";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef();
  const sidebarRef = useRef();

  const [fullName, setFullName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState("");

  // Fetch user profile using async/await
  useEffect(() => {
    // Define async function
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/profile");
        setFullName(response.data?.fullName || "User");
        setAvatar(response.data?.avatarUrl || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
        setFullName("User");
      } finally {
        setLoading(false);
      }
    };
    
    // Call the async function
    fetchUserProfile();
  }, []);

  // Navigation items with icons
  const menu = [
    { 
      label: "Dashboard", 
      path: "/admin/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      ) 
    },
    { 
      label: "Quản lý người dùng", 
      path: "/admin/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    },
    { 
      label: "Quản lý khóa học", 
      path: "/admin/courses",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      )
    },
    { 
      label: "Quản lý câu hỏi đánh giá", 
      path: "/admin/assessment",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
      )
    },
    { 
      label: "Kết quả đánh giá", 
      path: "/admin/assessment-result",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    { 
      label: "Chương trình cộng đồng", 
      path: "/admin/program",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    { 
      label: "Quản lý đăng ký khóa học & quizz", 
      path: "/admin/course-enrollment",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
        </svg>
      )
    },
    { 
      label: "Quản lý chuyên viên tư vấn", 
      path: "/admin/schedule",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    },
    { 
      label: "Báo cáo người dùng & Cuộc hẹn", 
      path: "/admin/report-appointment",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    },
  ];

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }

      // Close mobile menu on outside click
      if (mobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu when location changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle window resize to toggle sidebar based on screen size
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on initial load

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile menu button - visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside 
          ref={sidebarRef}
          className={`
            fixed inset-y-0 left-0 z-40 
            transform transition-all duration-300 ease-in-out
            bg-gradient-to-b from-indigo-800 to-indigo-900 
            text-white flex flex-col shadow-xl
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarCollapsed ? 'w-20' : 'w-64'}
            lg:relative lg:translate-x-0
          `}
        >
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between p-4 ${sidebarCollapsed ? 'justify-center' : 'px-6'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <svg className="h-8 w-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold text-xl tracking-tight">Admin Portal</span>
              </div>
            )}
            
            {/* Collapse/Expand button for desktop */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
              className="hidden lg:block text-indigo-300 hover:text-white transition-colors p-1 rounded-full hover:bg-indigo-700"
            >
              {sidebarCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {menu.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} px-3 py-3 rounded-md transition-all ${
                      location.pathname === item.path
                        ? "bg-indigo-700 text-white shadow-md"
                        : "text-indigo-100 hover:bg-indigo-700/50"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && <span className="ml-3 text-sm font-medium">{item.label}</span>}
                    {sidebarCollapsed && (
                      <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-indigo-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap transform scale-0 group-hover:scale-100 origin-left">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t border-indigo-700/50 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }}
                className="p-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div 
          className={`
            flex-1 flex flex-col min-w-0
            transition-all duration-300
            lg:pl-0
          `}
          style={{ 
            marginLeft: mobileMenuOpen ? (sidebarCollapsed ? '5rem' : '16rem') : 0,
            width: "calc(100% - " + (sidebarCollapsed ? '5rem' : '16rem') + ")",
            // Chỉ áp dụng margin trên desktop
            '@media (min-width: 1024px)': {
              marginLeft: sidebarCollapsed ? '5rem' : '16rem'
            }
          }}
        >
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm z-30">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* <h1 className="text-xl font-semibold text-gray-800">{
                  menu.find(item => item.path === location.pathname)?.label || "Dashboard"
                }</h1> */}
              </div>
              
              <div className="flex items-center gap-3" ref={menuRef}>
                {/* Notifications */}
                {/* <button className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button> */}
                
                {/* Separator */}
                <span className="h-6 w-px bg-gray-300"></span>
                
                {/* User Profile */}
                <div className="relative">
                  <button
                    className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => setOpenMenu(!openMenu)}
                    disabled={loading}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="User avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{fullName?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {loading ? "Loading..." : fullName}
                      </p>
                      <p className="text-xs text-gray-500">Quản trị viên</p>
                    </div>
                    <svg className="hidden md:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 transition transform origin-top-right">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-900">Đăng nhập bởi</p>
                        <p className="text-sm font-medium text-gray-700 truncate">{fullName}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/admin/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setOpenMenu(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Hồ sơ của tôi
                        </Link>
                        {/* <Link
                          to="/admin/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setOpenMenu(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link> */}
                      </div>
                      <div className="py-1">
                        <button
                          className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                          onClick={() => {
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                          }}
                        >
                          <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}