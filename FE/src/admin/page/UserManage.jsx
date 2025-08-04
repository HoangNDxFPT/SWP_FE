import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants for form options
const GENDER_OPTIONS = [
  { value: "", label: "Chọn giới tính" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" }
];

const ROLE_OPTIONS = [
  { value: "", label: "Chọn vai trò" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "CONSULTANT", label: "Tư vấn viên" },
  { value: "MEMBER", label: "Thành viên" }
];

// Role colors and icons
const ROLE_CONFIG = {
  ADMIN: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
  CONSULTANT: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    )
  },
  MEMBER: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    )
  }
};

// Empty user object template
const EMPTY_USER = {
  fullName: "",
  userName: "",
  email: "",
  phoneNumber: "",
  address: "",
  dateOfBirth: "",
  gender: "",
  role: "",
  password: ""
};

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // For actions loading states
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewEditModal, setShowViewEditModal] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ ...EMPTY_USER });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    consultants: 0,
    members: 0
  });

  // Thêm state cho lịch sử hoạt động người dùng
  const [activeHistoryTab, setActiveHistoryTab] = useState('profile');
  const [userPrograms, setUserPrograms] = useState([]);
  const [userAssessments, setUserAssessments] = useState([]);
  const [userAppointments, setUserAppointments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userCourses, setUserCourses] = useState([]);

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      (!searchTerm ||
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.userName && u.userName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (!selectedRole || u.role === selectedRole)
  );

  // Tính toán dữ liệu hiển thị theo trang
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  // Fetch user list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/profile/all");

      // Transform data structure
      const transformedUsers = res.data.map(user => ({
        id: user.userId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        userName: user.userName,
        email: user.email,
        role: user.role
      }));

      setUsers(transformedUsers || []);

      // Calculate stats
      if (transformedUsers) {
        const stats = {
          total: transformedUsers.length,
          admins: transformedUsers.filter(u => u.role === 'ADMIN').length,
          consultants: transformedUsers.filter(u => u.role === 'CONSULTANT').length,
          members: transformedUsers.filter(u => u.role === 'MEMBER').length
        };
        setStats(stats);
      }
    } catch (err) {
      toast.error("Không thể tải danh sách người dùng!");
      console.error("Error fetching users:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create new user
  const handleCreate = async () => {
    // Form validation
    if (!newUser.fullName || !newUser.userName || !newUser.role || !newUser.password) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post("/profile/create-user", newUser);
      toast.success("Tạo người dùng thành công!");
      fetchUsers();
      setShowCreateModal(false);
      setNewUser({ ...EMPTY_USER });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Bạn không có quyền thực hiện thao tác này!");
      } else {
        toast.error("Lỗi khi tạo người dùng: " + (err.response?.data?.message || "Lỗi không xác định"));
      }
      console.error("Error creating user:", err.response?.data || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Update user
  const handleSave = async () => {
    try {
      if (!selectedUser.fullName) {
        toast.error("Họ tên không được để trống!");
        return;
      }

      if (!selectedUser.role || selectedUser.role === "") {
        toast.error("Vai trò không được để trống!");
        return;
      }

      const formatRole = (roleValue) => {
        return roleValue ? roleValue.toUpperCase() : "";
      };

      const updatePayload = {
        userId: selectedUser.id,
        fullName: selectedUser.fullName,
        phoneNumber: selectedUser.phoneNumber || "",
        address: selectedUser.address || "",
        dateOfBirth: selectedUser.dateOfBirth || null,
        gender: selectedUser.gender || "",
        userName: selectedUser.userName || "",
        email: selectedUser.email || "",
        role: formatRole(selectedUser.role)
      };

      setActionLoading(true);
      const res = await api.patch(`/profile/admin-update`, updatePayload);

      // Update password if provided
      if (selectedUser.password) {
        try {
          await api.patch(`/profile/${selectedUser.id}/password`, {
            newPassword: selectedUser.password
          });
        } catch (passErr) {
          console.error("Error updating password:", passErr);
          toast.warning("Thông tin đã được cập nhật nhưng không thể thay đổi mật khẩu");
        }
      }

      // Give API time to update
      setTimeout(() => {
        fetchUsers();
      }, 500);

      setShowViewEditModal(false);
      setSelectedUser(null);
      setEditMode(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error("Error updating user:", err);
      console.error("Error response data:", err.response?.data);
      toast.error("Lỗi khi cập nhật: " + (err.response?.data?.message || "Lỗi không xác định"));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!id) {
      toast.error("ID người dùng không hợp lệ!");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        setDeleteId(id);
        setActionLoading(true);
        await api.delete(`/profile/${id}`);
        toast.success("Xóa người dùng thành công!");
        fetchUsers();
      } catch (err) {
        toast.error("Xóa thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
        console.error("Error deleting user:", err.response?.data || err.message);
      } finally {
        setActionLoading(false);
        setDeleteId(null);
      }
    }
  };

  // Hàm fetch lịch sử hoạt động của người dùng
  const fetchUserHistory = async (userId) => {
    setLoadingHistory(true);
    try {
      // Lấy chương trình đã tham gia
      const programsRes = await api.get(`/programs/history-user/${userId}`);
      setUserPrograms(programsRes.data || []);

      // Lấy lịch sử đánh giá
      const assessmentsRes = await api.get(`/assessment-results/user/${userId}`);
      setUserAssessments(assessmentsRes.data || []);

      // Lấy lịch sử khóa học
      const coursesRes = await api.get(`/enrollments/user/${userId}`);
      setUserCourses(coursesRes.data || []);

      // Lấy lịch sử cuộc hẹn
      try {
        const appointmentsRes = await api.get(`/appointment/appointments/admin/member/${userId}`);
        setUserAppointments(appointmentsRes.data || []);
      } catch (appointmentErr) {
        console.warn("Could not fetch appointments:", appointmentErr);
        setUserAppointments([]);
      }
    } catch (err) {
      console.error("Error fetching user history:", err);
      toast.error("Không thể tải lịch sử hoạt động của người dùng");
    } finally {
      setLoadingHistory(false);
    }
  };

  // View/Edit user
  const handleViewEdit = (user) => {
    setSelectedUser({ ...user });
    setEditMode(false);
    setShowViewEditModal(true);
    setActiveHistoryTab('profile');
    fetchUserHistory(user.id);
  };

  // Khi thay đổi bộ lọc hoặc tìm kiếm, reset về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header - Giống Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 rounded-3xl shadow-lg mx-6 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold">Quản Lý Người Dùng</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Xem và quản lý tất cả tài khoản người dùng trong hệ thống
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 text-right">
              <div className="text-blue-100 text-sm mb-1">Hôm nay</div>
              <div className="text-xl font-bold">{new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards - Điều chỉnh grid để responsive hơn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Quản trị viên</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Tư vấn viên</p>
                <p className="text-2xl font-bold text-gray-900">{stats.consultants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Thành viên</p>
                <p className="text-2xl font-bold text-gray-900">{stats.members}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter and Add Bar */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-3 flex-grow">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc username..."
                    className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-full md:w-56">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                  >
                    <option value="">Tất cả vai trò</option>
                    {ROLE_OPTIONS.filter(role => role.value).map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchTerm || selectedRole) && (
                  <button
                    className="md:w-auto w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRole("");
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                onClick={() => setShowCreateModal(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Thêm người dùng
              </button>
            </div>

            {/* Results summary */}
            <div className="mt-4 text-sm text-gray-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Hiển thị <span className="font-semibold mx-1">{filteredUsers.length}</span> trên tổng số <span className="font-semibold mx-1">{users.length}</span> người dùng
              {selectedRole && <span className="ml-1">với vai trò <span className="font-semibold">{selectedRole}</span></span>}
              {searchTerm && <span className="ml-1">khớp với từ khóa "<span className="font-semibold">{searchTerm}</span>"</span>}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Người dùng</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Tài khoản</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">Vai trò</th>
                  <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                      <p className="text-center text-gray-500 mt-2">Đang tải danh sách người dùng...</p>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-gray-500">Không tìm thấy người dùng nào phù hợp</p>
                      <button
                        onClick={() => { setSearchTerm(""); setSelectedRole(""); }}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.fullName || "Chưa cập nhật"}</div>
                            <div className="text-sm text-gray-200">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.userName}</div>
                        <div className="text-sm text-gray-500">
                          {user.phoneNumber || "Chưa cập nhật SĐT"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email || "Không có email"}</div>
                        <div className="text-sm text-gray-500">
                          {user.address ? `${user.address.substring(0, 20)}${user.address.length > 20 ? '...' : ''}` : "Chưa cập nhật địa chỉ"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_CONFIG[user.role]?.color || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                          {ROLE_CONFIG[user.role]?.icon}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out border border-blue-200"
                            onClick={() => handleViewEdit(user)}
                          >
                            {user.role === 'ADMIN' ? 'Chi tiết' : 'Chi tiết'}
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button
                              className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out border border-red-200"
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading && deleteId === user.id}
                            >
                              {actionLoading && deleteId === user.id ? (
                                <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : "Xóa"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Thêm người dùng mới</h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.fullName}
                  onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Nhập họ tên đầy đủ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.userName}
                  onChange={e => setNewUser({ ...newUser, userName: e.target.value })}
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Nhập địa chỉ email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.phoneNumber}
                  onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.dateOfBirth}
                  onChange={e => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.address}
                  onChange={e => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newUser.gender}
                  onChange={e => setNewUser({ ...newUser, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò <span className="text-red-500">*</span></label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-150 ease-in-out"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out flex items-center"
                onClick={handleCreate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Tạo người dùng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit User Modal */}
      {showViewEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? "Chỉnh sửa người dùng" : "Thông tin người dùng"}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setShowViewEditModal(false);
                  setEditMode(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!editMode && (
              <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.fullName ? selectedUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 ">{selectedUser.fullName}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_CONFIG[selectedUser.role]?.color || "bg-gray-100 text-gray-800"}`}>
                      {ROLE_CONFIG[selectedUser.role]?.icon}
                      {selectedUser.role}
                    </span>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-500">ID: {selectedUser.id}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            {!editMode && (
              <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveHistoryTab('profile')}
                  className={`py-2 px-4 mr-2 -mb-px whitespace-nowrap ${activeHistoryTab === 'profile'
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveHistoryTab('programs')}
                  className={`py-2 px-4 mr-2 -mb-px whitespace-nowrap ${activeHistoryTab === 'programs'
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Chương trình đã tham gia
                </button>
                <button
                  onClick={() => setActiveHistoryTab('courses')}
                  className={`py-2 px-4 mr-2 -mb-px whitespace-nowrap ${activeHistoryTab === 'courses'
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Khóa học đã đăng ký
                </button>
                <button
                  onClick={() => setActiveHistoryTab('assessments')}
                  className={`py-2 px-4 mr-2 -mb-px whitespace-nowrap ${activeHistoryTab === 'assessments'
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Lịch sử đánh giá
                </button>
                <button
                  onClick={() => setActiveHistoryTab('appointments')}
                  className={`py-2 px-4 -mb-px whitespace-nowrap ${activeHistoryTab === 'appointments'
                      ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Lịch sử cuộc hẹn
                </button>
              </div>
            )}

            {/* Profile Information Tab */}
            {(editMode || activeHistoryTab === 'profile') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên {editMode && <span className="text-red-500">*</span>}</label>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode && "bg-gray-50"}`}
                    value={selectedUser.fullName || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                    disabled={!editMode}
                    placeholder="Chưa cập nhật"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none bg-gray-50"
                    value={selectedUser.userName || ""}
                    disabled={true}
                  />
                  {editMode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tên đăng nhập không thể thay đổi
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode && "bg-gray-50"}`}
                    value={selectedUser.email || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    disabled={!editMode}
                    placeholder="Chưa cập nhật"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode && "bg-gray-50"}`}
                    value={selectedUser.phoneNumber || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                    disabled={!editMode}
                    placeholder="Chưa cập nhật"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode && "bg-gray-50"}`}
                    value={selectedUser.dateOfBirth || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, dateOfBirth: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode && "bg-gray-50"}`}
                    value={selectedUser.address || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, address: e.target.value })}
                    disabled={!editMode}
                    placeholder="Chưa cập nhật"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode ? "bg-gray-50" : "bg-white"}`}
                    value={selectedUser.gender || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, gender: e.target.value })}
                    disabled={!editMode}
                  >
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò {editMode && <span className="text-red-500">*</span>}</label>
                  <select
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!editMode ? "bg-gray-50" : "bg-white"}`}
                    value={selectedUser.role || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    disabled={!editMode}
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {editMode && selectedUser.role === "ADMIN" && (
                    <p className="text-xs text-orange-500 mt-1">
                      Cẩn thận khi thay đổi quyền của Quản trị viên
                    </p>
                  )}
                </div>

                {editMode && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đặt mật khẩu mới (để trống nếu không thay đổi)</label>
                    <input
                      type="password"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedUser.password || ""}
                      onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Programs History Tab */}
            {!editMode && activeHistoryTab === 'programs' && (
              <div>
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Đang tải lịch sử tham gia...</p>
                  </div>
                ) : userPrograms.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-gray-500">Không tìm thấy chương trình nào</p>
                    <button
                      onClick={() => { setSearchTerm(""); setSelectedRole(""); }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên chương trình</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa điểm</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userPrograms.map(program => (
                          <tr key={program.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{program.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{program.location || "Không có thông tin"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(program.start_date).toLocaleDateString('vi-VN')} - {new Date(program.end_date).toLocaleDateString('vi-VN')}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Assessments History Tab */}
            {!editMode && activeHistoryTab === 'assessments' && (
              <div>
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Đang tải lịch sử đánh giá...</p>
                  </div>
                ) : userAssessments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Chưa có lịch sử đánh giá</p>
                    <p className="text-gray-500">Người dùng này chưa thực hiện bài đánh giá nào</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userAssessments.map(assessment => (
                      <div key={assessment.assessmentResultId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Đánh giá {assessment.assessmentType}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Hoàn thành: {new Date(assessment.submittedAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium
                                ${assessment.riskLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                                  assessment.riskLevel === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'}`}>
                                {assessment.riskLevel === 'LOW' ? 'Thấp' :
                                  assessment.riskLevel === 'MODERATE' ? 'Trung bình' : 'Cao'}
                              </span>
                              <span className="ml-3 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                Điểm: {assessment.score}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Khuyến nghị:</h4>
                            <p className="text-sm text-gray-600">{assessment.recommendation}</p>
                          </div>

                          {assessment.recommendedCourses && assessment.recommendedCourses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Khóa học đề xuất:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {assessment.recommendedCourses.map(course => (
                                  <li key={course.id} className="text-sm text-gray-600">
                                    {course.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Courses Enrollment Tab */}
            {!editMode && activeHistoryTab === 'courses' && (
              <div>
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Đang tải danh sách khóa học...</p>
                  </div>
                ) : userCourses.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253v-13z" />
                    </svg>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Chưa đăng ký khóa học nào</p>
                    <p className="text-gray-500">Người dùng này chưa đăng ký khóa học nào trong hệ thống</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userCourses.map((course, index) => (
                          <tr key={`${course.courseId}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                              <div className="text-xs text-gray-500">ID khóa học: {course.courseId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === "Completed" ? "bg-green-100 text-green-800 border border-green-200" :
                                  course.status === "InProgress" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                    "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                }`}>
                                {course.status === "Completed" ? "Đã hoàn thành" :
                                  course.status === "InProgress" ? "Đang học" :
                                    "Đã đăng ký"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(course.enrolledAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Appointments History Tab */}
            {!editMode && activeHistoryTab === 'appointments' && (
              <div>
                {loadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-500">Đang tải lịch sử cuộc hẹn...</p>
                  </div>
                ) : userAppointments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8h6M7 21a2 2 0 01-2-2v-6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H7z" />
                    </svg>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Chưa có cuộc hẹn nào</p>
                    <p className="text-gray-500">Người dùng này chưa đặt lịch hẹn tư vấn nào trong hệ thống</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userAppointments.map((appointment, index) => (
                      <div key={appointment.id || index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Cuộc hẹn #{appointment.id}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Tư vấn viên: {appointment.consultantName}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                }`}>
                                {appointment.status === 'COMPLETED' ? 'Hoàn thành' :
                                  appointment.status === 'PENDING' ? 'Chờ xác nhận' :
                                    appointment.status === 'CANCELLED' ? 'Đã hủy' :
                                      appointment.status || 'Không xác định'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin cuộc hẹn:</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Ngày hẹn:</span> {new Date(appointment.date).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}</p>
                                <p><span className="font-medium">Thời gian:</span> {appointment.startTime} - {appointment.endTime}</p>
                                <p><span className="font-medium">Thành viên:</span> {appointment.memberName}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Chi tiết đặt lịch:</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Ngày tạo:</span> {new Date(appointment.createAt).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}</p>
                                <p><span className="font-medium">Mã cuộc hẹn:</span> #{appointment.id}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              {editMode ? (
                <>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-150 ease-in-out"
                    onClick={() => setEditMode(false)}
                  >
                    Hủy chỉnh sửa
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out flex items-center"
                    onClick={handleSave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 13l4 4L19 7" clipRule="evenodd" />
                        </svg>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition duration-150 ease-in-out"
                    onClick={() => setShowViewEditModal(false)}
                  >
                    Đóng
                  </button>
                  {selectedUser?.role !== 'ADMIN' && (
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-150 ease-in-out flex items-center"
                                           onClick={() => setEditMode(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </button>
                  )}
                </>
              )}
            </div>

            {/* User Activity History - Tabbed interface for profile, programs, assessments */}
            <div className="mt-6">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveHistoryTab('profile')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeHistoryTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.403 1.403A2 2 0 0116 21H8a2 2 0 01-1.597-3.215L5 17h5m5-8h4a2  2 0 002 2v4m-6-6h-4a2 2 0 00-2 2v4m6-10h-4a2 2 0 00-2 2v4" />
                  </svg>
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveHistoryTab('programs')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeHistoryTab === 'programs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M3 12h18m-7 8h4a2 2 0 002-2v-4m-6 6H5a2 2 0 01-2-2v-4m6 6v-6" />
                  </svg>
                  Chương trình đã tham gia
                </button>
                <button
                  onClick={() => setActiveHistoryTab('courses')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeHistoryTab === 'courses' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8h18M3 12h18m-7 8h4a2 2 0 002-2v-4m-6 6H5a2 2 0 01-2-2v-4m6 6v-6" />
                  </svg>
                  Khóa học đã đăng ký
                </button>
                <button
                  onClick={() => setActiveHistoryTab('assessments')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeHistoryTab === 'assessments' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m8-9a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-4-4z" />
                  </svg>
                  Lịch sử đánh giá
                </button>
              </div>

              {/* Tab content - Conditional rendering based on active tab */}
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                {activeHistoryTab === 'profile' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cá nhân</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Họ tên</p>
                        <p className="text-gray-800">{selectedUser.fullName || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Tên đăng nhập</p>
                        <p className="text-gray-800">{selectedUser.userName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Email</p>
                        <p className="text-gray-800">{selectedUser.email || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
                        <p className="text-gray-800">{selectedUser.phoneNumber || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Ngày sinh</p>
                        <p className="text-gray-800">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Địa chỉ</p>
                        <p className="text-gray-800">{selectedUser.address || "Chưa cập nhật"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Giới tính</p>
                        <p className="text-gray-800">{selectedUser.gender === "MALE" ? "Nam" : selectedUser.gender === "FEMALE" ? "Nữ" : "Chưa xác định"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Vai trò</p>
                        <p className="text-gray-800">{selectedUser.role}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeHistoryTab === 'programs' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Chương trình đã tham gia</h3>
                    {loadingHistory ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : userPrograms.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Chưa có chương trình nào</p>
                    ) : (
                      <div className="space-y-4">
                        {userPrograms.map(program => (
                          <div key={program.id} className="p-4 bg-white rounded-lg shadow">
                            <h4 className="text-md font-semibold text-gray-900">{program.name}</h4>
                            <p className="text-sm text-gray-600">Mô tả: {program.description || "Chưa có mô tả"}</p>
                            <p className="text-sm text-gray-600">Thời gian: {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-600">Trạng thái: <span className={`font-medium ${program.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}>{program.status === "ACTIVE" ? "Đang diễn ra" : "Đã kết thúc"}</span></p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeHistoryTab === 'courses' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Khóa học đã đăng ký</h3>
                    {loadingHistory ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : userCourses.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253v-13z" />
                        </svg>
                        <p className="mt-4 text-gray-600 text-lg font-medium">Chưa đăng ký khóa học nào</p>
                        <p className="text-gray-500">Người dùng này chưa đăng ký khóa học nào trong hệ thống</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userCourses.map((course, index) => (
                              <tr key={`${course.courseId}-${index}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                                  <div className="text-xs text-gray-500">ID khóa học: {course.courseId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === "Completed" ? "bg-green-100 text-green-800 border border-green-200" :
                                      course.status === "InProgress" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                                        "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                    }`}>
                                    {course.status === "Completed" ? "Đã hoàn thành" :
                                      course.status === "InProgress" ? "Đang học" :
                                        "Đã đăng ký"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(course.enrolledAt).toLocaleDateString('vi-VN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}