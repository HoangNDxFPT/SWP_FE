import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, login } from "../../redux/features/userSlice";
import api from "../../config/axios";
import { toast } from "react-toastify";


function ConsultantHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userSliceState = useSelector((state) => state.user);
  const currentUser = userSliceState ? userSliceState.user : null;
  const avatar = currentUser ? currentUser.avatar : "/default-avatar.png"; // Đặt ảnh đại diện mặc định nếu không có
  const user = currentUser ? currentUser : { fullName: "Tên người dùng" }; // Hiển thị tên người dùng mặc định nếu không có thông tin
  const [openDropdown, setOpenDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    if (!currentUser || !currentUser.fullName) {
      const token = localStorage.getItem("token");
      if (token) {
        const fetchUserProfile = async () => {
          try {
            const response = await api.get("profile");
            dispatch(login(response.data));
          } catch (error) {
            if (
              error.response?.status === 401 ||
              error.response?.status === 403
            ) {
              toast.error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
              );
            } else {
              toast.error("Không thể khôi phục phiên. Vui lòng đăng nhập lại.");
            }
            localStorage.removeItem("token");
            dispatch(logout());
          }
        };
        fetchUserProfile();
      }
    }
  }, [userSliceState, currentUser, dispatch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // MENU CHUYÊN VIÊN TƯ VẤN
  const menuItems = [
    
    { label: "Trang chủ", path: "/consultant/appointments" },
    { label: "Khóa học", path: "/consultant/courses" },
    { label: "Chương trình cộng đồng", path: "/consultant/programs" },


    
    // Thêm các mục khác nếu cần
  ];

  return (
    <header className="w-full bg-blue-600 text-white shadow flex items-center px-8 py-3 justify-between relative z-50">
      {/* Logo + menu trái */}
      <div className="flex items-center gap-10">
        <img
          src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg"
          alt="Logo"
          className="w-16 h-16 cursor-pointer rounded-xl object-cover"
          
        />
        <nav className="hidden md:flex gap-7 font-semibold">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="hover:text-pink-200 transition"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      

      {/* Avatar & user */}
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <img
          src={avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full border-2 border-blue-200 object-cover"
        />
        <span className="font-semibold">
          {user?.fullName || "Tên người dùng"}
        </span>
        <button
          className="ml-2 focus:outline-none"
          onClick={() => setOpenDropdown((v) => !v)}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {/* Dropdown menu */}
        {openDropdown && (
          <div className="absolute right-0 top-14 bg-white text-blue-800 rounded shadow-lg min-w-[180px] py-2 z-50">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-blue-50"
              onClick={() => {
                setOpenDropdown(false);
                navigate("/consultant/profile");
              }}
            >
              Hồ sơ cá nhân
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-blue-50"
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
            >
              Đăng xuất
            </button>
            
          </div>
        )}
      </div>
    </header>
  );
}

export default ConsultantHeader;
