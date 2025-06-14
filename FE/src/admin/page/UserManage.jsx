import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import api from "../../config/axios";

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    userName: "",
    password: "",
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: "MALE",
    role: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Helper để lấy id đúng trường
  const getUserId = (user) => user.id || user.userId || user._id;

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const res = await api.get("profile/all");
      setUsers(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách user!");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by role và search term
  const filteredUsers = users
    .filter(u => !selectedRole || String(u.role) === selectedRole)
    .filter(u =>
      (u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.userName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Save edited user
  const handleSave = async () => {
    try {
      await api.put("profile", selectedUser);
      toast.success("Edit user successfully!");
      setSelectedUser(null);
      fetchUsers();
    } catch {
      toast.error("Edit failed!");
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await api.delete(`profile/${id}`);
        toast.success("Delete user successfully!");
        fetchUsers();
      } catch {
        toast.error("Delete failed!");
      }
    }
  };

  // Create user
  const handleCreate = async () => {
    if (!newUser.fullName || !newUser.userName || !newUser.role || !newUser.password) {
      toast.error("Full name, username, password and role are required!");
      return;
    }
    try {
      await api.post("profile/create-user", newUser);
      toast.success("User created successfully!");
      setShowCreate(false);
      setNewUser({
        userName: "",
        password: "",
        email: "",
        fullName: "",
        phoneNumber: "",
        address: "",
        dateOfBirth: "",
        gender: "MALE",
        role: ""
      });
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || "Create failed!");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-900">User Account Management</h1>
      <button
        className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        onClick={() => setShowCreate(true)}
      >
        Create User
      </button>
      {/* Search input và filter by role cùng hàng */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="mr-2 font-semibold">Filter by role:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
          >
            <option value="">All</option>
            <option value="ADMIN">Admin</option>
            <option value="CONSULTANT">Consultant</option>
            <option value="MEMBER">Member</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="Search by name or username"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="text-gray-500 hover:text-red-500 text-xl font-bold px-2"
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">No.</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Full Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Username</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Role</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={getUserId(user)} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{user.fullName}</td>
                  <td className="px-4 py-2">{user.userName}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => setSelectedUser(user)}
                    >
                      View / Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleDelete(getUserId(user))}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for user details and edit */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">User Details & Edit</h2>
            <div className="space-y-2">
              <div>
                <b>Full Name:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.fullName}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Username:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.userName}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, userName: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Email:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.email}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Phone:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.phoneNumber}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Address:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.address}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, address: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Date of Birth:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.dateOfBirth || ""}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Gender:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.gender}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, gender: e.target.value })
                  }
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <b>Role:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.role}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <option value="ADMIN">Admin</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="MEMBER">Member</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for create user */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <div className="space-y-2">
              <div>
                <b>Full Name:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.fullName}
                  onChange={e =>
                    setNewUser({ ...newUser, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Username:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.userName}
                  onChange={e =>
                    setNewUser({ ...newUser, userName: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Password:</b>
                <input
                  type="password"
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.password}
                  onChange={e =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Email:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.email}
                  onChange={e =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Phone:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.phoneNumber}
                  onChange={e =>
                    setNewUser({ ...newUser, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Address:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.address}
                  onChange={e =>
                    setNewUser({ ...newUser, address: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Date of Birth:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.dateOfBirth}
                  onChange={e =>
                    setNewUser({ ...newUser, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Gender:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.gender}
                  onChange={e =>
                    setNewUser({ ...newUser, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <b>Role:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.role}
                  onChange={e =>
                    setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="">Select role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="CONSULTANT">Consultant</option>
                  <option value="MEMBER">Member</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}