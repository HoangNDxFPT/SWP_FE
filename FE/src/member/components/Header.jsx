import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, login } from '../../redux/features/userSlice';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userSliceState = useSelector(state => state.user);
  const currentUser = userSliceState ? userSliceState.user : null;
  const display_name = currentUser ? currentUser.userName : null;

  // Thêm event listener để đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("Header useEffect: Component mounted or user/dispatch changed.");
    console.log("Header useEffect: Current Redux user slice state:", userSliceState);
    console.log("Header useEffect: Current user object in slice:", currentUser);
    if (!currentUser || !currentUser.fullName) {
      const token = localStorage.getItem('token');
      console.log("Header useEffect: Token from localStorage:", token ? "Found" : "Not Found");

      if (token) {
        const fetchUserProfile = async () => {
          try {
            console.log("Header useEffect: Attempting to fetch user profile from API...");
            const response = await api.get('profile');
            console.log("Header useEffect: User profile fetched successfully:", response.data);

            dispatch(login(response.data));
          } catch (error) {
            console.error("Header useEffect: Lỗi khi lấy thông tin hồ sơ người dùng:", error);
            if (error.response) {
              console.error("API error response data:", error.response.data);
              console.error("API error status:", error.response.status);
            }

            if (error.response?.status === 401 || error.response?.status === 403) {
              toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            } else {
              toast.error("Không thể khôi phục phiên. Vui lòng đăng nhập lại.");
            }
            localStorage.removeItem('token');
            dispatch(logout());
          }
        };
        fetchUserProfile();
      }
    } else {
      console.log("Header useEffect: User (fullName) đã có trong Redux state. Không cần fetch profile.");
    }
  }, [userSliceState, currentUser, dispatch]); 

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token'); 
    navigate('/'); 
    window.location.reload(); 
  };

  const menuItems = [
    { label: 'About Us', path: '/about-us' },
    { label: 'Courses', path: '/courseList' },
    { label: 'Assessment', path: '/assessment' },
    { label: 'Online Consultant', path: '/consultantList' },
    { label: 'Community Program', path: '/com-program' },
  ];

  return (
    <header className="flex items-center justify-between px-12 py-4 shadow-sm bg-white">
      <div className="flex items-center gap-2">
        <a href='/'>
          <img
            src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg"
            alt="Logo"
            className="w-20"
          />
        </a>
      </div>
      <nav className="flex gap-8 text-gray-700 font-medium">
        {menuItems.map(item => (
          <a
            key={item.label}
            href={display_name ? item.path : "/login"}
            onClick={e => {
              if (!display_name) {
                e.preventDefault();
                navigate("/login");
              }
              if (item.path === '#') {
                e.preventDefault();
              }
            }}
            className="hover:text-blue-500"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="flex gap-2 items-center">
        {display_name ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-500 focus:outline-none"
            >
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                {display_name?.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold">{display_name}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100">
                <a 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Hồ sơ cá nhân
                  </div>
                </a>
                <a 
                  href="/assessment-history" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Lịch sử đánh giá
                  </div>
                </a>
                <a 
                  href="/booking-history" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Lịch sử đặt lịch hẹn
                  </div>
                </a>
                <a 
                  href="/quiz-history" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Lịch sử bài kiểm tra
                  </div>
                </a>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    Đăng xuất
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <a href="/register">
              <button className="border border-blue-500 text-blue-500 px-4 py-1 rounded hover:bg-blue-50 transition">Sign up</button>
            </a>
            <a href="/login">
              <button className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition">Sign in</button>
            </a>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
