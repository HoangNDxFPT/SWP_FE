import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Spin } from "antd";
import { toast, ToastContainer } from "react-toastify";
import api from "../../config/axios";
import ConsultantHeader from "../components/Header";

import {
  UserCircleIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  LinkIcon,
  KeyIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { uploadImageToCloudinary } from "../../services/uploadCloudinary";

// Bạn có thể import Header từ project thật, dưới đây là placeholder
const Header = ({ user }) => (
  <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-semibold">
        Drug Use Prevention Support System
      </h1>
      <nav>
        <ul className="flex space-x-4">
          <li>
            <a href="#" className="hover:text-blue-200 transition-colors">
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200 transition-colors">
              Appointments
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200 transition-colors">
              Profile
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-blue-200 transition-colors">
              Logout
            </a>
          </li>
        </ul>
      </nav>
      {user && (
        <div className="flex items-center space-x-2">
          <img
            src={
              user.avatarUrl ||
              "https://placehold.co/40x40/ADD8E6/000000?text=AV"
            }
            alt="User Avatar"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <span className="font-medium">{user.fullName || "User"}</span>
        </div>
      )}
    </div>
  </header>
);

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState({});
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwMsg, setPwMsg] = useState("");
  const [pwMsgType, setPwMsgType] = useState("");

  // Lấy user từ localStorage
  const loadUserFromLocalStorage = useCallback(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    } catch (e) {
      setUser(null);
      console.error("Error loading user from localStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromLocalStorage();
  }, [loadUserFromLocalStorage]);

  // Lấy profile từ API
  const fetchProfileData = useCallback(async () => {
    if (activeTab === "profile") {
      setLoading(true);
      try {
        const res = await api.get("/consultant/profile");
        setProfile(res.data);
        setEditProfile(res.data);
      } catch (e) {
        toast.error("Không thể tải thông tin hồ sơ!");
        setProfile(null);
        console.error("Error fetching profile data:", e);
      } finally {
        setLoading(false);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handlePwInput = useCallback((e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPwMsg("");
    setPwMsgType("");
  }, []);

  const handleChangePassword = useCallback(
    async (e) => {
      e.preventDefault();
      setPwMsg("");
      setPwMsgType("");

      if (
        !pwForm.oldPassword ||
        !pwForm.newPassword ||
        !pwForm.confirmPassword
      ) {
        setPwMsg("Vui lòng nhập đầy đủ thông tin!");
        setPwMsgType("error");
        return;
      }
      if (pwForm.newPassword.length < 6) {
        setPwMsg("Mật khẩu mới phải có ít nhất 6 ký tự!");
        setPwMsgType("error");
        return;
      }
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        setPwMsg("Mật khẩu xác nhận không khớp!");
        setPwMsgType("error");
        return;
      }

      setChangePwLoading(true);
      try {
        await api.post("/change-password", {
          oldPassword: pwForm.oldPassword,
          newPassword: pwForm.newPassword,
        });
        setPwMsg("Đổi mật khẩu thành công!");
        setPwMsgType("success");
        setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Đổi mật khẩu thành công!");
      } catch (err) {
        let msg = "Đổi mật khẩu thất bại!";
        if (err.response?.status === 401) {
          msg = "Mật khẩu cũ không đúng!";
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.message) {
          msg = err.message;
        }
        setPwMsg(msg);
        setPwMsgType("error");
        toast.error(msg);
      } finally {
        setChangePwLoading(false);
      }
    },
    [pwForm]
  );

  // Cập nhật hồ sơ
  const handleProfileUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const dataToUpdate = {
          consultantId: profile?.consultantId,
          fullName: editProfile.fullName || "",
          phoneNumber: editProfile.phoneNumber || "",
          address: editProfile.address || "",
          status: profile?.status || "",
          degree: editProfile.degree || "",
          information: editProfile.information || "",
           avatarUrl: editProfile.avatarUrl || "",
          certifiedDegree: editProfile.certifiedDegree || "",
          certifiedDegreeImage: editProfile.certifiedDegreeImage || "",
          googleMeetLink: editProfile.googleMeetLink || "",
        };
        await api.put("/consultant/profile", dataToUpdate);
        toast.success("Cập nhật hồ sơ thành công!");
        setEditMode(false);
        await fetchProfileData();
      } catch (err) {
        let msg = "Cập nhật hồ sơ thất bại!";
        if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.message) {
          msg = err.message;
        }
        toast.error(msg);
      }
    },
    [editProfile, profile, fetchProfileData]
  );

  const mainContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full min-h-[300px]">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      );
    }

    if (activeTab === "profile") {
      return editMode ? (
        <form
          className="flex flex-col gap-5 bg-white rounded-xl shadow-lg p-8"
          onSubmit={handleProfileUpdate}
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-3">
            Chỉnh sửa hồ sơ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
  <label htmlFor="avatarUrl" className="font-semibold text-gray-700 block mb-1">
    Ảnh đại diện
  </label>
  <input
    id="avatarUrl"
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        toast.info("Đang upload ảnh đại diện...");
        const url = await uploadImageToCloudinary(file);
        setEditProfile({ ...editProfile, avatarUrl: url });
        toast.success("Upload thành công!");
      } catch {
        toast.error("Upload ảnh thất bại!");
      }
    }}
    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
/>
  {editProfile.avatarUrl && (
    <img
      src={editProfile.avatarUrl}
      alt="Avatar preview"
      className="mt-2 rounded-full w-20 h-20 border shadow"
      onError={e => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/80x80/ADD8E6/000000?text=AV";
      }}
    />
  )}
</div>

            <div>
              <label
                htmlFor="fullName"
                className="font-semibold text-gray-700 block mb-1"
              >
                Họ tên
              </label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={editProfile.fullName || ""}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, fullName: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div>
              <label
                htmlFor="phoneNumber"
                className="font-semibold text-gray-700 block mb-1"
              >
                Số điện thoại
              </label>
              <input
                id="phoneNumber"
                type="text"
                name="phoneNumber"
                value={editProfile.phoneNumber || ""}
                onChange={(e) =>
                  setEditProfile({
                    ...editProfile,
                    phoneNumber: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="font-semibold text-gray-700 block mb-1"
              >
                Địa chỉ
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={editProfile.address || ""}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, address: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div>
              <label
                htmlFor="degree"
                className="font-semibold text-gray-700 block mb-1"
              >
                Học vị
              </label>
              <input
                id="degree"
                type="text"
                name="degree"
                value={editProfile.degree || ""}
                onChange={(e) =>
                  setEditProfile({ ...editProfile, degree: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="information"
                className="font-semibold text-gray-700 block mb-1"
              >
                Thông tin giới thiệu
              </label>
              <textarea
                id="information"
                name="information"
                value={editProfile.information || ""}
                onChange={(e) =>
                  setEditProfile({
                    ...editProfile,
                    information: e.target.value,
                  })
                }
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div>
              <label
                htmlFor="certifiedDegree"
                className="font-semibold text-gray-700 block mb-1"
              >
                Chứng nhận
              </label>
              <input
                id="certifiedDegree"
                type="text"
                name="certifiedDegree"
                value={editProfile.certifiedDegree || ""}
                onChange={(e) =>
                  setEditProfile({
                    ...editProfile,
                    certifiedDegree: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
           <div>
  <label htmlFor="certifiedDegreeImage" className="font-semibold text-gray-700 block mb-1">
    Ảnh chứng nhận
  </label>
  <input
    id="certifiedDegreeImage"
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        toast.info("Đang upload ảnh chứng chỉ...");
        const url = await uploadImageToCloudinary(file);
        setEditProfile({ ...editProfile, certifiedDegreeImage: url });
        toast.success("Upload thành công!");
      } catch {
        toast.error("Upload ảnh thất bại!");
      }
    }}
    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
/>
  {editProfile.certifiedDegreeImage && (
    <img
      src={editProfile.certifiedDegreeImage}
      alt="Certified preview"
      className="mt-2 rounded-lg w-40 border shadow"
    />
  )}
</div>
            <div className="md:col-span-2">
              <label
                htmlFor="googleMeetLink"
                className="font-semibold text-gray-700 block mb-1"
              >
                Link Google Meet
              </label>
              <input
                id="googleMeetLink"
                type="url"
                name="googleMeetLink"
                value={editProfile.googleMeetLink || ""}
                onChange={(e) =>
                  setEditProfile({
                    ...editProfile,
                    googleMeetLink: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6 justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="border border-gray-400 text-gray-700 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : (
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-4 text-blue-800 border-b pb-3">
            Hồ sơ cá nhân
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Họ tên:</span>{" "}
              <span>{profile?.fullName || user?.fullName || "--"}</span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Số điện thoại:</span>{" "}
              <span>{profile?.phoneNumber || user?.phoneNumber || "--"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Địa chỉ:</span>{" "}
              <span>{profile?.address || user?.address || "--"}</span>
            </div>
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Học vị:</span>{" "}
              <span>{profile?.degree || "--"}</span>
            </div>
            <div className="md:col-span-2 flex items-start gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <span className="font-semibold">Giới thiệu:</span>{" "}
              <p className="flex-grow">
                {profile?.information || "Chưa cập nhật thông tin cá nhân."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Ngày sinh:</span>{" "}
              <span>{user?.dateOfBirth || "--"}</span>
            </div>
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Giới tính:</span>{" "}
              <span>
                {user?.gender === "MALE"
                  ? "Nam"
                  : user?.gender === "FEMALE"
                  ? "Nữ"
                  : "Khác"}
              </span>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <DocumentTextIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Chứng nhận:</span>{" "}
              <span>{profile?.certifiedDegree || "--"}</span>
            </div>
            {profile?.certifiedDegreeImage && (
              <div className="md:col-span-2 flex flex-col items-center mt-4">
                <span className="font-semibold text-blue-700 mb-2">
                  Ảnh chứng nhận:
                </span>
                <img
                  src={profile.certifiedDegreeImage}
                  alt="Certified Degree"
                  className="max-w-xs md:max-w-sm rounded-lg shadow-md border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/300x200/FFCCCC/000000?text=No+Image";
                  }}
                />
              </div>
            )}
            {profile?.googleMeetLink && (
              <div className="md:col-span-2 flex items-center gap-3 mt-4">
                <LinkIcon className="w-6 h-6 text-blue-500" />
                <span className="font-semibold">Google Meet:</span>{" "}
                <a
                  href={profile.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {profile.googleMeetLink}
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8 justify-center">
            <button
              onClick={() => {
                setEditMode(true);
                setEditProfile(profile || {});
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </section>
      );
    } else if (activeTab === "contact") {
      return (
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-700 border-b pb-3">
            Thông tin liên hệ
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-center gap-3 text-lg">
              <PhoneIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Số điện thoại:</span>{" "}
              <span>{user?.phoneNumber || "--"}</span>
            </div>
            <div className="flex items-center gap-3 text-lg">
              <EnvelopeIcon className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Email:</span>{" "}
              <span>{user?.email || "--"}</span>
            </div>
            {/* Google Meet Link */}
            {profile?.googleMeetLink && (
              <div className="flex items-center gap-3 text-lg">
                <LinkIcon className="w-6 h-6 text-blue-500" />
                <span className="font-semibold">Google Meet:</span>{" "}
                <a
                  href={profile.googleMeetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {profile.googleMeetLink}
                </a>
              </div>
            )}
          </div>
        </section>
      );
    } else if (activeTab === "changePassword") {
      return (
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 border-b pb-3">
            Đổi mật khẩu
          </h2>
          <form className="flex flex-col gap-5" onSubmit={handleChangePassword}>
            <div>
              <label
                htmlFor="oldPassword"
                className="font-semibold text-gray-700 block mb-1"
              >
                Mật khẩu cũ
              </label>
              <input
                id="oldPassword"
                type="password"
                name="oldPassword"
                value={pwForm.oldPassword}
                onChange={handlePwInput}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label
                htmlFor="newPassword"
                className="font-semibold text-gray-700 block mb-1"
              >
                Mật khẩu mới
              </label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={pwForm.newPassword}
                onChange={handlePwInput}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="font-semibold text-gray-700 block mb-1"
              >
                Xác nhận mật khẩu mới
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={pwForm.confirmPassword}
                onChange={handlePwInput}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                required
              />
            </div>

            {pwMsg && (
              <div
                className={`text-center mt-2 p-3 rounded-lg font-medium ${
                  pwMsgType === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
                role="alert"
              >
                {pwMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={changePwLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all duration-300 mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {changePwLoading ? (
                <>
                  <Spin size="small" className="mr-2" /> Đang xử lý...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </form>
        </section>
      );
    }
    return null;
  }, [
    loading,
    activeTab,
    editMode,
    profile,
    user,
    editProfile,
    pwForm,
    pwMsg,
    pwMsgType,
    changePwLoading,
    handleProfileUpdate,
    handleChangePassword,
    handlePwInput,
    fetchProfileData,
  ]);

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 min-h-screen font-inter text-gray-800">
      <ConsultantHeader />
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar trái */}
        <aside className="bg-white rounded-xl shadow-xl p-8 w-full lg:w-80 flex flex-col items-center flex-shrink-0">
          <img
            src={
              profile?.avatarUrl ||
              user?.avatarUrl ||
              "https://placehold.co/120x120/ADD8E6/000000?text=AVATAR"
            }
            alt="avatar"
            className="w-32 h-32 rounded-full border-4 border-blue-400 mb-4 object-cover shadow-md"
          />
          <h1 className="font-bold text-2xl text-blue-800 mb-2">
            {user?.fullName || "Chuyên gia"}
          </h1>
          <p className="text-gray-600 text-sm mb-1">
            {user?.gender === "MALE"
              ? "Nam"
              : user?.gender === "FEMALE"
              ? "Nữ"
              : "Khác"}
            {user?.relationshipStatus ? `, ${user.relationshipStatus}` : ""}
          </p>
          <p className="text-gray-500 text-xs text-center mb-4">
            {user?.address || "Chưa cập nhật địa chỉ"}
          </p>

          {/* Sidebar tab menu */}
          <ul className="w-full mt-4 text-blue-700 text-lg space-y-3">
            <li
              className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors duration-200
                ${
                  activeTab === "profile"
                    ? "bg-blue-100 text-blue-800 font-bold shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600"
                }
              `}
              onClick={() => setActiveTab("profile")}
            >
              <UserCircleIcon className="w-6 h-6" /> Hồ sơ cá nhân
            </li>
            <li
              className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors duration-200
                ${
                  activeTab === "contact"
                    ? "bg-blue-100 text-blue-800 font-bold shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600"
                }
              `}
              onClick={() => setActiveTab("contact")}
            >
              <EnvelopeIcon className="w-6 h-6" /> Liên hệ
            </li>
            <li
              className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors duration-200
                ${
                  activeTab === "changePassword"
                    ? "bg-blue-100 text-blue-800 font-bold shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600"
                }
              `}
              onClick={() => setActiveTab("changePassword")}
            >
              <KeyIcon className="w-6 h-6" /> Đổi mật khẩu
            </li>
          </ul>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-6 min-h-[500px]">
          {mainContent}
        </main>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
