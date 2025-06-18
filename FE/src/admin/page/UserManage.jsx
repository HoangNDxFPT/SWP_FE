import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    username: "",
    email: "",
    phonenumber: "",
    address: "",
    date_of_birth: "",
    gender: "M",
    role_id: "",
    password: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/src/data/data.json")
      .then(res => res.json())
      .then(data => {
        setUsers(data.Users || []);
        const roleMap = {};
        (data.Roles || []).forEach(r => {
          roleMap[r.id] = r.name;
        });
        setRoles(roleMap);
      });
  }, []);

  // Filter users by role và search term
  const filteredUsers = users
    .filter(u => !selectedRole || String(u.role_id) === selectedRole)
    .filter(u =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSave = () => {
    fetch(`http://localhost:5000/Users/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedUser)
    })
      .then(res => {
        if (res.ok) {
          setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
          setSelectedUser(null);
          toast.success("Edit user successfully!");
        } else {
          toast.error("Edit failed!");
        }
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      fetch(`http://localhost:5000/Users/${id}`, {
        method: "DELETE"
      })
        .then(res => {
          if (res.ok) {
            setUsers(users.filter(u => u.id !== id));
            toast.success("Delete user successfully!");
          } else {
            toast.error("Delete failed!");
          }
        });
    }
  };

  // Tạo user mới
  const handleCreate = () => {
    if (!newUser.full_name || !newUser.username || !newUser.role_id || !newUser.password) {
      toast.error("Full name, username, password and role are required!");
      return;
    }
    fetch("http://localhost:5000/Users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newUser,
        id: (Math.max(0, ...users.map(u => +u.id || 0)) + 1).toString(),
      })
    })
      .then(res => res.json())
      .then(data => {
        setUsers([...users, data]);
        setShowCreate(false);
        setNewUser({
          full_name: "",
          username: "",
          email: "",
          phonenumber: "",
          address: "",
          date_of_birth: "",
          gender: "M",
          role_id: "",
          password: ""
        });
        toast.success("User created successfully!");
      });
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
            {Object.entries(roles).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
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
                <tr key={user.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{user.full_name}</td>
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{roles[user.role_id] || "No role assigned"}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => setSelectedUser(user)}
                    >
                      View / Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => handleDelete(user.id)}
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
                  value={selectedUser.full_name}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Username:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.username}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, username: e.target.value })
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
                  value={selectedUser.phonenumber}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, phonenumber: e.target.value })
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
                  value={selectedUser.date_of_birth}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, date_of_birth: e.target.value })
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
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <b>Role:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedUser.role_id}
                  onChange={e =>
                    setSelectedUser({ ...selectedUser, role_id: e.target.value })
                  }
                >
                  {Object.entries(roles).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
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
                  value={newUser.full_name}
                  onChange={e =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Username:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.username}
                  onChange={e =>
                    setNewUser({ ...newUser, username: e.target.value })
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
                  value={newUser.phonenumber}
                  onChange={e =>
                    setNewUser({ ...newUser, phonenumber: e.target.value })
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
                  value={newUser.date_of_birth}
                  onChange={e =>
                    setNewUser({ ...newUser, date_of_birth: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Gender:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.gender}
                  onChange={e =>
                    setNewUser({ ...newUser, gender: e.target.value })
                  }
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <b>Role:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newUser.role_id}
                  onChange={e =>
                    setNewUser({ ...newUser, role_id: e.target.value })
                  }
                >
                  <option value="">Select role</option>
                  {Object.entries(roles).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
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