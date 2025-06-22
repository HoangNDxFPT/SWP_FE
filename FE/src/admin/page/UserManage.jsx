import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants for form options
const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

const ROLE_OPTIONS = [
  { value: "", label: "Select Role" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "MEMBER", label: "Member" }
];

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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewEditModal, setShowViewEditModal] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ ...EMPTY_USER });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Fetch user list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Thêm tiền tố /api
      const res = await api.get("/profile/all");
      console.log("Response data:", res.data);
      
      // Biến đổi dữ liệu để phù hợp với cấu trúc hiển thị
      const transformedUsers = res.data.map(user => ({
        id: user.userId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        // Các trường từ AdminProfileDTO
        userName: user.userName || "N/A",
        email: user.email || "N/A",
        role: user.role || "MEMBER"
      }));
      
      setUsers(transformedUsers || []);
    } catch (err) {
      toast.error("Failed to load user list!");
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
      toast.error("Please fill in all required fields!");
      return;
    }

    try {
      // Thêm tiền tố /api
      const res = await api.post("/profile/create-user", newUser);
      toast.success("User created successfully!");
      fetchUsers(); // Refresh lại danh sách
      setShowCreateModal(false);
      setNewUser({ ...EMPTY_USER });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized! Please log in again.");
      } else {
        toast.error("Failed to create user: " + (err.response?.data?.message || "Unknown error"));
      }
      console.error("Error creating user:", err.response?.data || err.message);
    }
  };

  // Save edited user
  const handleSave = async () => {
    try {
      if (!selectedUser.fullName) {
        toast.error("Full name is required!");
        return;
      }
      
      // Tạo AdminProfileDTO với đầy đủ thông tin
      const updatePayload = {
        userId: selectedUser.id,
        fullName: selectedUser.fullName,
        phoneNumber: selectedUser.phoneNumber || "",
        address: selectedUser.address || "",
        dateOfBirth: selectedUser.dateOfBirth || null,
        gender: selectedUser.gender || "",
        userName: selectedUser.userName || "",  // Thêm trường của AdminProfileDTO
        email: selectedUser.email || "",        // Thêm trường của AdminProfileDTO
        role: selectedUser.role,               // Thêm trường của AdminProfileDTO
      };
      
      console.log("Sending update payload:", updatePayload);
      
      // Sử dụng endpoint riêng cho admin
      const res = await api.patch(`/profile/admin-update`, updatePayload);
      
      // Xử lý cập nhật mật khẩu nếu có
      if (selectedUser.password) {
        try {
          await api.patch(`/profile/${selectedUser.id}/password`, { 
            newPassword: selectedUser.password 
          });
          console.log("Password updated successfully");
        } catch (passErr) {
          console.error("Error updating password:", passErr);
          toast.warning("Profile updated but password could not be changed");
        }
      }
      
      fetchUsers(); // Refresh lại danh sách
      setShowViewEditModal(false);
      setSelectedUser(null);
      setEditMode(false);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error("Failed to update user: " + (err.response?.data?.message || "Unknown error"));
      console.error("Error updating user:", err.response?.data || err.message);
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!id) {
      toast.error("User ID không hợp lệ!");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Thêm tiền tố /api
        await api.delete(`/profile/${id}`);
        toast.success("Delete user successfully!");
        fetchUsers();
      } catch (err) {
        toast.error("Delete failed: " + (err.response?.data?.message || "Unknown error"));
        console.error("Error deleting user:", err.response?.data || err.message);
      }
    }
  };

  // View/Edit user
  const handleViewEdit = (user) => {
    setSelectedUser({ ...user });
    setEditMode(false); // Mở modal ở chế độ xem trước
    setShowViewEditModal(true);
  };

  // Filter users
  const filteredUsers = users.filter(
    (u) =>
      !searchTerm ||
      (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.userName && u.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4">
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="text-2xl font-bold mb-6 text-blue-900">User Management</h1>

      {/* Search and Add Bar */}
      <div className="flex flex-wrap justify-between gap-4 mb-6 items-center">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search by name, username, or email"
            className="border rounded-l px-3 py-2 w-64 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="bg-blue-100 p-2 rounded-r border-t border-r border-b border-gray-300"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowCreateModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                      user.role === "MANAGER" ? "bg-blue-100 text-blue-800" :
                      user.role === "CONSULTANT" ? "bg-green-100 text-green-800" :
                      user.role === "STAFF" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleViewEdit(user)}
                      >
                        View/Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.fullName}
                    onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.userName}
                    onChange={e => setNewUser({ ...newUser, userName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.phoneNumber}
                    onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.dateOfBirth}
                    onChange={e => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={newUser.address}
                  onChange={e => setNewUser({ ...newUser, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.gender}
                    onChange={e => setNewUser({ ...newUser, gender: e.target.value })}
                  >
                    {GENDER_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role <span className="text-red-500">*</span></label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    required
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit User Modal */}
      {showViewEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editMode ? "Edit User" : "User Details"}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowViewEditModal(false);
                  setEditMode(false);
                }}
              >
                ✕
              </button>
            </div>
            
            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name {editMode && <span className="text-red-500">*</span>}</label>
                  <input
                    type="text"
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                    value={selectedUser.fullName || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded px-3 py-2 bg-gray-100"
                    value={selectedUser.userName || ""}
                    disabled={true} // Luôn khóa không cho phép chỉnh sửa
                  />
                  {editMode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Username không thể thay đổi sau khi tạo tài khoản
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                    value={selectedUser.email || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    disabled={!editMode || selectedUser.email === "N/A"} // Khóa nếu là giá trị mặc định
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                    value={selectedUser.phoneNumber || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                    value={selectedUser.dateOfBirth || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, dateOfBirth: e.target.value })}
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.address || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, address: e.target.value })}
                  disabled={!editMode}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
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
                  <label className="block text-sm font-medium text-gray-700">Role {editMode && <span className="text-red-500">*</span>}</label>
                  <select
                    className={`mt-1 block w-full border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                    value={selectedUser.role || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                    disabled={!editMode || selectedUser.role === "ADMIN"} // Khóa nếu là Admin
                  >
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {editMode && selectedUser.role === "ADMIN" && (
                    <p className="text-xs text-red-500 mt-1">
                      Không thể thay đổi quyền của Admin
                    </p>
                  )}
                </div>
              </div>

              {editMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={selectedUser.password || ""}
                    onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })}
                  />
                </div>
              )}
            </form>

            <div className="flex justify-end gap-2 mt-6">
              {editMode ? (
                <>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowViewEditModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}