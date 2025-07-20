import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../config/axios";

function ConsultantHeader() {
  const navigate = useNavigate();
  const userSliceState = useSelector((state) => state.user);
  const currentUser = userSliceState ? userSliceState.user : null;

  // State cho profile riêng
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [openDropdown, setOpenDropdown] = React.useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/consultant/profile")
        .then(res => setProfile(res.data))
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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

  const menuItems = [
    { label: "Trang chủ", path: "/consultant/appointments" },
    { label: "Khóa học", path: "/consultant/courses" },
    { label: "Chương trình cộng đồng", path: "/consultant/programs" },
  ];

  // Lấy avatarUrl và displayName ưu tiên từ profile, fallback về redux, cuối cùng là chuỗi mặc định
  const avatar =
    profile?.avatarUrl ||
    (currentUser?.avatarUrl || "https://placehold.co/40x40/ADD8E6/000000?text=AV");
  const displayName =
    profile?.fullName || currentUser?.fullName || "Tên người dùng";

  return (
    <header className="w-full bg-blue-600 text-white shadow flex items-center px-8 py-3 justify-between relative z-50">
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

      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <img
          src={avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
          onError={e => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/40x40/ADD8E6/000000?text=AV";
          }}
        />
        <span className="font-semibold">{displayName}</span>
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
