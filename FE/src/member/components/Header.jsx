import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, login } from '../../redux/features/userSlice';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  }, [dropdownRef]);

  useEffect(() => {
    if (!currentUser || !currentUser.fullName) {
      const token = localStorage.getItem('token');

      if (token) {
        const fetchUserProfile = async () => {
          try {
            const response = await api.get('/profile');
            dispatch(login(response.data));
          } catch (error) {
            console.error("Lỗi khi lấy thông tin hồ sơ người dùng:", error);

            // Log chi tiết lỗi để debug
            if (error.response?.status === 404) {
              console.error("API endpoint không tồn tại:", error.config?.url);
              toast.error("Không tìm thấy API endpoint. Vui lòng kiểm tra server.");
            } else if (error.response?.status === 401 || error.response?.status === 403) {
              toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            } else {
              console.error("Chi tiết lỗi:", error.response?.data);
              toast.error("Không thể khôi phục phiên. Vui lòng đăng nhập lại.");
            }
            localStorage.removeItem('token');
            dispatch(logout());
          }
        };
        fetchUserProfile();
      }
    }
  }, [userSliceState, currentUser, dispatch]); 

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token'); 
    navigate('/'); 
    window.location.reload(); 
  };

  const menuItems = [
    { label: 'Về chúng tôi', path: '/about-us' },
    { label: 'Khóa học', path: '/courseList' },
    { label: 'Đánh giá', path: '/assessment' },
    { label: 'Tư vấn trực tuyến', path: '/consultantList' },
    { label: 'Chương trình cộng đồng', path: '/com-program' },
  ];

  return (
    // <header className="shadow-md sticky top-0 z-50" style={{ backgroundColor: '#F7F7F7' }}>
    <header className="bg-neutral-100 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href='/' className="flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg"
                alt="Logo"
                className="h-12 w-auto rounded-lg shadow"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-blue-900 leading-tight">Drug Prevention</span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (display_name) {
                    navigate(item.path);
                  } else {
                    navigate("/login");
                  }
                }}
                className="text-gray-700 hover:text-blue-600 px-2 py-1 text-sm font-medium rounded-md transition-colors duration-200 hover:bg-blue-50 bg-transparent"
                style={{ border: "none", background: "none" }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Profile or Auth Buttons */}
          <div className="flex items-center">
            {display_name ? (
              <div className="relative ml-3" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 focus:outline-none p-1 rounded-full hover:bg-blue-50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-sm">
                    {display_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block font-medium text-gray-800">{display_name}</span>
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-100 ring-1 ring-black ring-opacity-5">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium group-hover:text-blue-600">Hồ sơ cá nhân</span>
                      </div>
                    </Link>
                    <Link 
                      to="/assessment-history" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium group-hover:text-blue-600">Lịch sử đánh giá</span>
                      </div>
                    </Link>
                    <Link 
                      to="/booking-history" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium group-hover:text-blue-600">Lịch sử đặt lịch hẹn</span>
                      </div>
                    </Link>
                    <Link 
                      to="/quiz-history" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium group-hover:text-blue-600">Lịch sử bài kiểm tra</span>
                      </div>
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 group-hover:text-red-700" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium group-hover:text-red-700">Đăng xuất</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="border border-blue-500 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition duration-200 text-sm font-medium bg-transparent"
                >
                  Đăng ký
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm text-sm font-medium"
                >
                  Đăng nhập
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden ml-3">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Mở menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (display_name) {
                      navigate(item.path);
                    } else {
                      navigate("/login");
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-transparent"
                  style={{ border: "none", background: "none" }}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile auth buttons */}
              {!display_name && (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/login");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white text-center"
                    >
                      Đăng nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/register");
                        setMobileMenuOpen(false);
                      }}
                      className="block px-3 py-2 rounded-md text-base font-medium border border-blue-500 text-blue-600 text-center"
                    >
                      Đăng ký
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
