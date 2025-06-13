import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { toast } from "react-toastify";

function AdminProfilePage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await api.get("profile");
        if (response.status === 200 && response.data) {
          const profileData = {
            fullName: response.data.fullName || "",
            phoneNumber: response.data.phoneNumber || "",
            address: response.data.address || "",
            dateOfBirth: response.data.dateOfBirth
              ? new Date(response.data.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: response.data.gender || ""
          };
          setAdmin(profileData);
          setOriginalAdmin(profileData); // Lưu trạng thái ban đầu
        }
      } catch (err) {
        console.error("API Error:", err);
        
        if (err.response && err.response.status === 401) {
          toast.error("Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.");
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        
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
    
    fetchAdminProfile();
  }, [navigate]);

  const validateForm = () => {
    const errors = {};
    if (!admin.fullName || admin.fullName.trim() === "") {
      errors.fullName = "Họ tên không được để trống";
    } else if (admin.fullName.length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự";
    }
    
    if (admin.address && admin.address.length > 200) {
      errors.address = "Địa chỉ không được quá 200 ký tự";
    }
    
    // Thêm validation cho ngày sinh (không được là ngày trong tương lai)
    if (admin.dateOfBirth) {
      const selectedDate = new Date(admin.dateOfBirth);
      const today = new Date();
      if (selectedDate > today) {
        errors.dateOfBirth = "Ngày sinh không thể là ngày trong tương lai";
      }
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdmin({ ...admin, [name]: value });
    // Xóa lỗi của trường đang nhập khi người dùng sửa
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleSave = async () => {
    // Validate form trước khi gửi
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Vui lòng sửa các lỗi trong biểu mẫu");
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.put("profile", admin);
      
      if (response.status === 200) {
        toast.success("Cập nhật thông tin thành công!");
        setEditMode(false);
        // Cập nhật lại thông tin ở localStorage nếu cần
        if (admin.fullName) {
          localStorage.setItem("full_name", admin.fullName);
        }
        setOriginalAdmin({...admin}); // Cập nhật dữ liệu gốc
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Cập nhật thông tin thất bại: " + 
        (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Kiểm tra xem có thay đổi không
    const hasChanges = JSON.stringify(admin) !== JSON.stringify(originalAdmin);
    
    if (hasChanges) {
      if (window.confirm("Bạn có chắc muốn hủy các thay đổi?")) {
        setAdmin({...originalAdmin}); // Khôi phục dữ liệu gốc
        setEditMode(false);
        setFormErrors({});
      }
    } else {
      setEditMode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Đang tải thông tin hồ sơ admin...</p>
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
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Admin Profile</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="font-semibold">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="fullName"
            value={admin.fullName}
            onChange={handleChange}
            disabled={!editMode}
            className={`p-2 border rounded w-full ${
              formErrors.fullName ? 'border-red-500' : 'bg-gray-100'
            } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
          />
          {formErrors.fullName && (
            <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Phone Number</label>
          <input
            type="text"
            name="phoneNumber"
            value={admin.phoneNumber}
            onChange={handleChange}
            disabled
            className="p-2 border rounded w-full bg-gray-200 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="font-semibold">Address</label>
          <input
            type="text"
            name="address"
            value={admin.address}
            onChange={handleChange}
            disabled={!editMode}
            className={`p-2 border rounded w-full ${
              formErrors.address ? 'border-red-500' : 'bg-gray-100'
            } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
          />
          {formErrors.address && (
            <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={admin.dateOfBirth}
            onChange={handleChange}
            disabled={!editMode}
            className={`p-2 border rounded w-full ${
              formErrors.dateOfBirth ? 'border-red-500' : 'bg-gray-100'
            } focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
          />
          {formErrors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className="font-semibold">Gender</label>
          <select
            name="gender"
            value={admin.gender}
            onChange={handleChange}
            disabled={!editMode}
            className="p-2 border rounded w-full bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="flex gap-4 mt-6 justify-center">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`${
                  isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-2 rounded-md font-semibold transition-colors duration-200`}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
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

export default AdminProfilePage;
