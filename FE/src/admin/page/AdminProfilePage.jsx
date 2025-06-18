import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { toast } from "react-toastify";

function AdminProfilePage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState(null);

  // State cho modal đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
          setOriginalAdmin(profileData);
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
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleSave = async () => {
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
        if (admin.fullName) {
          localStorage.setItem("full_name", admin.fullName);
        }
        setOriginalAdmin({ ...admin });
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
    const hasChanges = JSON.stringify(admin) !== JSON.stringify(originalAdmin);

    if (hasChanges) {
      if (window.confirm("Bạn có chắc muốn hủy các thay đổi?")) {
        setAdmin({ ...originalAdmin });
        setEditMode(false);
        setFormErrors({});
      }
    } else {
      setEditMode(false);
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.oldPassword) {
      errors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    } else if (passwordForm.oldPassword && passwordForm.oldPassword === passwordForm.newPassword) {
      errors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); // Ngăn submit reload trang
    const errors = validatePasswordForm();
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPassword(true);
    try {
      await api.post("change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
    } catch (error) {
      const msg = error.response?.data?.message || "";
      if (
        msg.toLowerCase().includes("mật khẩu") ||
        msg.toLowerCase().includes("old password") ||
        msg.toLowerCase().includes("current password")
      ) {
        setPasswordErrors({
          ...passwordErrors,
          oldPassword: msg || "Mật khẩu hiện tại không đúng",
        });
      } else {
        toast.error(msg || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsChangingPassword(false);
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
    <div className="max-w-xl mx-auto mt-8 border border-dotted border-blue-300 p-6 rounded-lg bg-white">
      {/* Tab chọn */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className={`font-semibold border-none bg-transparent px-1 ${
            activeTab === "info"
              ? "text-blue-700 underline cursor-default"
              : "text-gray-500 hover:text-blue-700 cursor-pointer"
          }`}
          disabled={activeTab === "info"}
          onClick={() => setActiveTab("info")}
          style={{ outline: "none" }}
        >
          Thông tin cá nhân
        </button>
        <span className="text-gray-400">-</span>
        <button
          className={`font-semibold border-none bg-transparent px-1 ${
            activeTab === "password"
              ? "text-blue-700 underline cursor-default"
              : "text-gray-500 hover:text-blue-700 cursor-pointer"
          }`}
          disabled={activeTab === "password"}
          onClick={() => setActiveTab("password")}
          style={{ outline: "none" }}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Nội dung từng tab */}
      {activeTab === "info" && (
        <form>
          {/* Thông tin cá nhân */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-semibold">Họ và tên <span className="text-red-500">*</span></label>
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
              <label className="font-semibold">Số điện thoại</label>
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
              <label className="font-semibold">Địa chỉ</label>
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
              <label className="font-semibold">Ngày sinh</label>
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
              <label className="font-semibold">Giới tính</label>
              <select
                name="gender"
                value={admin.gender}
                onChange={handleChange}
                disabled={!editMode}
                className="p-2 border rounded w-full bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Chọn giới tính</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div className="flex gap-4 mt-6 justify-center">
              {editMode ? (
                <>
                  <button
                    type="button" // Thêm dòng này
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`${
                      isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white px-6 py-2 rounded-md font-semibold transition-colors duration-200`}
                  >
                    {isSaving ? "Đang lưu..." : "Lưu lại"}
                  </button>
                  <button
                    type="button" // Thêm dòng này
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
                  >
                    Hủy bỏ
                  </button>
                </>
              ) : (
                <button
                  type="button" // Thêm dòng này
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  Chỉnh sửa thông tin
                </button>
              )}
            </div>
          </div>
        </form>
      )}
      {activeTab === "password" && (
        <form>
          {/* Đổi mật khẩu */}
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  oldPassword: e.target.value
                })}
                className={`p-2 border rounded w-full ${
                  passwordErrors.oldPassword ? 'border-red-500' : ''
                }`}
              />
              {passwordErrors.oldPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.oldPassword}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value
                })}
                className={`p-2 border rounded w-full ${
                  passwordErrors.newPassword ? 'border-red-500' : ''
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value
                })}
                className={`p-2 border rounded w-full ${
                  passwordErrors.confirmPassword ? 'border-red-500' : ''
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                setPasswordErrors({});
              }}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              disabled={isChangingPassword}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className={`px-4 py-2 text-white rounded ${
                isChangingPassword
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Đổi mật khẩu</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value
                  })}
                  className={`p-2 border rounded w-full ${
                    passwordErrors.oldPassword ? 'border-red-500' : ''
                  }`}
                />
                {passwordErrors.oldPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.oldPassword}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  className={`p-2 border rounded w-full ${
                    passwordErrors.newPassword ? 'border-red-500' : ''
                  }`}
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  className={`p-2 border rounded w-full ${
                    passwordErrors.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordErrors({});
                }}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                disabled={isChangingPassword}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className={`px-4 py-2 text-white rounded ${
                  isChangingPassword
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProfilePage;