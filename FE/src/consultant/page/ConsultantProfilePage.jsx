import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { toast } from "react-toastify";

function ConsultantProfilePage() {
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchConsultantProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        }
        const response = await api.get("profile");
        if (response.status === 200 && response.data) {
          setConsultant({
            fullName: response.data.fullName || "",
            phoneNumber: response.data.phoneNumber || "",
            address: response.data.address || "",
            dateOfBirth: response.data.dateOfBirth
              ? new Date(response.data.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: response.data.gender || ""
          });
        } else {
          throw new Error("Không thể lấy thông tin hồ sơ consultant.");
        }
      } catch (err) {
        setError(err);
        if (err.response) {
          toast.error(`Lỗi tải hồ sơ: ${err.response.data?.message || err.response.statusText}`);
        } else {
          toast.error(`Lỗi mạng hoặc không xác định: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchConsultantProfile();
  }, []);

  const handleChange = (e) => {
    setConsultant({ ...consultant, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token xác thực. Vui lòng đăng nhập lại.");
        return;
      }
      const response = await api.patch("profile", consultant);
      if (response.status === 200) {
        setEditMode(false);
        toast.success("Hồ sơ consultant đã được cập nhật thành công!");
      } else {
        toast.error("Cập nhật hồ sơ thất bại!");
      }
    } catch (err) {
      if (err.response) {
        toast.error(`Lỗi cập nhật: ${err.response.data?.message || err.response.statusText}`);
      } else {
        toast.error("Đã xảy ra lỗi mạng hoặc lỗi không xác định!");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Đang tải thông tin hồ sơ consultant...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <p>Không thể tải hồ sơ: {error.message}. Vui lòng thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-10 mb-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 font-semibold hover:underline"
      >
        &lt; Back
      </button>
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Consultant Profile</h2>
      <div className="flex flex-col gap-4">
        <label className="font-semibold">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={consultant.fullName}
          onChange={handleChange}
          disabled={!editMode}
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <label className="font-semibold">Phone Number</label>
        <input
          type="text"
          name="phoneNumber"
          value={consultant.phoneNumber}
          onChange={handleChange}
          disabled
          className="p-2 border rounded bg-gray-200 cursor-not-allowed"
        />

        <label className="font-semibold">Address</label>
        <input
          type="text"
          name="address"
          value={consultant.address}
          onChange={handleChange}
          disabled={!editMode}
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <label className="font-semibold">Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          value={consultant.dateOfBirth}
          onChange={handleChange}
          disabled={!editMode}
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <label className="font-semibold">Gender</label>
        <select
          name="gender"
          value={consultant.gender}
          onChange={handleChange}
          disabled={!editMode}
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>

        <div className="flex gap-4 mt-6 justify-center">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsultantProfilePage;
