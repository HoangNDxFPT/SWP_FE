import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, login } from '../../redux/features/userSlice';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function ConsultantHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userSliceState = useSelector(state => state.user);
  const currentUser = userSliceState ? userSliceState.user : null;
  const display_name = currentUser ? currentUser.fullName : null;

  useEffect(() => {
    if (!currentUser || !currentUser.fullName) {
      const token = localStorage.getItem('token');
      if (token) {
        const fetchUserProfile = async () => {
          try {
            const response = await api.get('profile');
            dispatch(login(response.data));
          } catch (error) {
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
    }
  }, [userSliceState, currentUser, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/');
    window.location.reload();
  };

  // MENU CHUYÊN VIÊN TƯ VẤN
  const menuItems = [
    { label: 'Dashboard', path: '/consultant/dashboard' },
    { label: 'Lịch hẹn', path: '/consultant/appointments' },
    { label: 'Hồ sơ tư vấn', path: '/consultant/cases' },
    { label: 'Ghi chú', path: '/consultant/notes' },
    // Thêm các mục khác nếu cần
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
            <span className="font-semibold text-blue-700">
              {display_name} <span className="text-xs text-gray-500">(Consultant)</span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-blue-500 text-blue-500 px-4 py-1 rounded hover:bg-blue-50 transition"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <a href="/login">
              <button className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition">Sign in</button>
            </a>
          </>
        )}
      </div>
    </header>
  );
}

export default ConsultantHeader;
