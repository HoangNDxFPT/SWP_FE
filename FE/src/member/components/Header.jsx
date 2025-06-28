import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, login } from '../../redux/features/userSlice';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userSliceState = useSelector(state => state.user);
  const currentUser = userSliceState ? userSliceState.user : null;
  const display_name = currentUser ? currentUser.userName : null;

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
    { label: 'About Us', path: '#' },
    { label: 'Courses', path: '/courseList' },
    { label: 'Survey', path: '/servey' },
    { label: 'Online Consultant', path: '/consultantList' },
    { label: 'Blogs', path: '/blogs' },

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
          <>
            <a href="/assessment-history">
              <span className="font-semibold text-gray-700">Assessment History</span>
            </a>
            <a href="/profile" className="ml-4">
              <span className="font-semibold text-gray-700">Hello, {display_name}</span>
            </a>
            <button
              onClick={handleLogout}
              className="border border-blue-500 text-blue-500 px-4 py-1 rounded hover:bg-blue-50 transition"
            >
              Log out
            </button>
          </>
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
