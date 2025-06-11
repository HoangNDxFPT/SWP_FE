import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

function Header() {
  const full_name = localStorage.getItem('full_name');
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem('full_name');
    navigate('/');
    window.location.reload();
  };

  // Close dropdown when click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { label: 'About Us', path: '#' },
    { label: 'Courses', path: '/courseList' },
    { label: 'Survey', path: '#' },
    { label: 'Online Consultant', path: '#' },
    { label: 'News', path: '#' },
    { label: 'Blogs', path: '#' },
    { label: 'Contact', path: '#' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-blue-600 text-white shadow">
      <div className="flex items-center justify-between px-12 py-4">
        <div className="flex items-center gap-2">
          <a href='/'>
            <img
              src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1748824738/z6621531660497_00c45b7532add5b3a49055fb93d63a53_ewd8xj.jpg"
              alt="Logo"
              className="w-20"
            />
          </a>
        </div>
        <nav className="flex gap-8 font-medium">
          {menuItems.map(item => (
            <a
              key={item.label}
              href={full_name ? item.path : "/login"}
              onClick={e => {
                if (!full_name) {
                  e.preventDefault();
                  window.location.href = "/login";
                }
              }}
              className="hover:text-yellow-200 transition"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex gap-2 items-center relative" ref={menuRef}>
          {full_name ? (
            <>
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="font-semibold px-4 py-1 rounded hover:bg-blue-700 transition flex items-center gap-2"
              >
                {full_name}
                <svg className={`w-4 h-4 transition-transform ${openMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white text-gray-800 rounded shadow z-50">
                  <button
                    onClick={() => { setOpenMenu(false); navigate('/userProfile'); }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                  >
                    Log out
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <a href="/register">
                <button className="border border-white text-white px-4 py-1 rounded hover:bg-blue-700 transition">Sign up</button>
              </a>
              <a href="/login">
                <button className="bg-white text-blue-600 px-4 py-1 rounded hover:bg-blue-100 transition">Sign in</button>
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header