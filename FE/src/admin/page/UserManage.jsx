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
      const res = await api.get("/profile/all");
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Failed to load user list!");
      console.error(err);
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
      // Проверяем наличие токена
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You need to be logged in to create users!");
        return;
      }

      const res = await api.post("/profile", newUser);
      setUsers([...users, res.data]);
      setShowCreateModal(false);
      setNewUser({ ...EMPTY_USER });
      toast.success("User created successfully!");
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Unauthorized! Please log in again.");
        // Можно добавить редирект на страницу логина
      } else {
        toast.error("Failed to create user: " + (err.response?.data?.message || "Unknown error"));
      }
      console.error(err);
    }
  };

  // Save edited user
  const handleSave = async () => {
    try {
      const res = await api.put(`/profile/${selectedUser.id}`, selectedUser);
      setUsers(users.map(u => u.id === selectedUser.id ? res.data : u));
      setShowViewEditModal(false);
      setSelectedUser(null);
      setEditMode(false);
      toast.success("User updated successfully!");
    } catch (err) {
      toast.error("Failed to update user!");
      console.error(err);
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
        await api.delete(`/profile/${id}`);
        toast.success("Delete user successfully!");
        fetchUsers();
      } catch (err) {
        toast.error("Delete failed!");
        if (err.response) {
          console.error("Backend error:", err.response.data);
        }
      }
    }
  };

  // View/Edit user
  const handleViewEdit = (user) => {
    setSelectedUser({ ...user });
    setEditMode(false);
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
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by name, username, or email"
          className="border rounded px-3 py-2 w-64"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => setShowCreateModal(true)}
        >
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
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.userName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "ADMIN" ? "bg-red-100 text-red-800" :
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
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleViewEdit(user)}
                      >
                        View / Edit
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
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  className="border rounded px-3 py-2"
                  value={newUser.fullName}
                  onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Username *"
                  className="border rounded px-3 py-2"
                  value={newUser.userName}
                  onChange={e => setNewUser({ ...newUser, userName: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="border rounded px-3 py-2"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Phone"
                  className="border rounded px-3 py-2"
                  value={newUser.phoneNumber}
                  onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  className="border rounded px-3 py-2"
                  value={newUser.dateOfBirth}
                  onChange={e => setNewUser({ ...newUser, dateOfBirth: e.target.value })}
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                className="border rounded px-3 py-2"
                value={newUser.address}
                onChange={e => setNewUser({ ...newUser, address: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded px-3 py-2"
                  value={newUser.gender}
                  onChange={e => setNewUser({ ...newUser, gender: e.target.value })}
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  className="border rounded px-3 py-2"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <input
                type="password"
                placeholder="Password *"
                className="border rounded px-3 py-2"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View/Edit User Modal */}
      {showViewEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editMode ? "Edit User" : "User Details"}
            </h2>
            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.fullName || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                  disabled={!editMode}
                />
                <input
                  type="text"
                  placeholder="Username"
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.userName || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, userName: e.target.value })}
                  disabled={!editMode}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.email || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  disabled={!editMode}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Phone"
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.phoneNumber || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                  disabled={!editMode}
                />
                <input
                  type="date"
                  placeholder="Date of Birth"
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.dateOfBirth || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, dateOfBirth: e.target.value })}
                  disabled={!editMode}
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                value={selectedUser.address || ""}
                onChange={e => setSelectedUser({ ...selectedUser, address: e.target.value })}
                disabled={!editMode}
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.gender || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, gender: e.target.value })}
                  disabled={!editMode}
                >
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  className={`border rounded px-3 py-2 ${!editMode && "bg-gray-100"}`}
                  value={selectedUser.role || ""}
                  onChange={e => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  disabled={!editMode}
                >
                  {ROLE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              {editMode ? (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setShowViewEditModal(false)}
                  >
                    Close
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