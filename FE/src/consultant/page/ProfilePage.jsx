import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../../config/axios";
import { Rate, Spin, message } from "antd";
import { toast, ToastContainer } from "react-toastify";

export default function ProfilePage() {
  const [user, setUser] = useState(null); // Dữ liệu user từ /api/login
  const [profile, setProfile] = useState(null); // Dữ liệu hồ sơ từ /api/consultant/profile
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false); // Chế độ chỉnh sửa hồ sơ
  const [editProfile, setEditProfile] = useState({}); // Dữ liệu chỉnh sửa hồ sơ

  // Giả lập dữ liệu badge (fans, trust, legal) nếu chưa có API thực
  const badges = {
    fans: 4, // 1-5
    trust: 5,
    legal: 3,
  };

  // Lấy thông tin user từ localStorage (sau login)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    setLoading(false);
  }, []);

  // Lấy thông tin hồ sơ /api/consultant/profile khi vào tab "Hồ sơ"
  useEffect(() => {
    if (activeTab === "profile") {
      setLoading(true);
      api
        .get("/consultant/profile")
        .then((res) => {
          setProfile(res.data);
        })
        .catch((e) =>
          message.error("Không thể tải thông tin hồ sơ!", e.message)
        )
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  // Nội dung động theo tab
  let mainContent = null;
  if (activeTab === "profile") {
    // Nếu đang ở chế độ chỉnh sửa
    mainContent = loading ? (
      <Spin />
    ) : editMode ? (
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            // Chỉ gửi các trường đã chỉnh sửa, nếu không có thì gửi chuỗi rỗng
            const safeProfile = {
              fullName: editProfile.fullName || "",
              phoneNumber: editProfile.phoneNumber || "",
              address: editProfile.address || "",
              status: editProfile.status || "",
              degree: editProfile.degree || "",
              information: editProfile.information || "",
              certifiedDegree: editProfile.certifiedDegree || "",
            };
            console.log("Body gửi lên:", safeProfile);
            await api.put("/consultant/profile", safeProfile); // Gửi dữ liệu chỉnh sửa lên server

            console.log("Body gửi đi:", editProfile);
            await api.put("/consultant/profile", editProfile);
            message.success("Cập nhật hồ sơ thành công!");
            toast.success("Cập nhật hồ sơ thành công!");
            setEditMode(false);
            // Reload lại profile mới
            const res = await api.get("/consultant/profile");
            setProfile(res.data);
          } catch (err) {
            toast.error("Cập nhật hồ sơ thất bại!");
            if (err.response) {
              console.error("API lỗi cập nhật hồ sơ:", err.response.data);
            }
          }
        }}
      >
        <label className="font-semibold">Họ tên</label>
        <input
          type="text"
          name="fullName"
          value={editProfile.fullName || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, fullName: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Số điện thoại</label>
        <input
          type="text"
          name="phoneNumber"
          value={editProfile.phoneNumber || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, phoneNumber: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Địa chỉ</label>
        <input
          type="text"
          name="address"
          value={editProfile.address || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, address: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Trạng thái</label>
        <input
          type="text"
          name="status"
          value={editProfile.status || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, status: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Học vị</label>
        <input
          type="text"
          name="degree"
          value={editProfile.degree || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, degree: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Thông tin</label>
        <textarea
          name="information"
          value={editProfile.information || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, information: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <label className="font-semibold">Chứng nhận</label>
        <input
          type="text"
          name="certifiedDegree"
          value={editProfile.certifiedDegree || ""}
          onChange={(e) =>
            setEditProfile({ ...editProfile, certifiedDegree: e.target.value })
          }
          className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex gap-4 mt-6 justify-center">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
          >
            Hủy
          </button>
        </div>
      </form>
    ) : (
      // View Mode
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-2">
          {profile?.fullName || user?.fullName || "Hồ sơ"}
        </h2>
        <div className="mb-2 text-gray-600">
          {profile?.information || "Chưa cập nhật thông tin cá nhân."}
        </div>
        {/* Chỉ số badge */}
        <div className="flex gap-8 mb-4 items-center">
          <div>
            <span className="mr-2 font-semibold">Fans:</span>
            <Rate disabled defaultValue={badges.fans} />
          </div>
          <div>
            <span className="mr-2 font-semibold">Tin cậy:</span>
            <Rate disabled defaultValue={badges.trust} />
          </div>
          <div>
            <span className="mr-2 font-semibold">Thân thiện:</span>
            <Rate disabled defaultValue={badges.legal} />
          </div>
        </div>
        {/* ...các trường như cũ */}
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Số điện thoại:</span>{" "}
          {profile?.phoneNumber || user?.phoneNumber || "--"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Địa chỉ:</span>{" "}
          {profile?.address || user?.address || "--"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Ngày sinh:</span>{" "}
          {profile?.dateOfBirth || user?.dateOfBirth || "--"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Giới tính:</span>{" "}
          {user?.gender === "MALE"
            ? "Nam"
            : user?.gender === "FEMALE"
            ? "Nữ"
            : "Khác"}
          {user?.relationshipStatus ? `, ${user.relationshipStatus}` : ""}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Học vị:</span>{" "}
          {profile?.degree || "--"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Chứng nhận:</span>{" "}
          {profile?.certifiedDegree || "--"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-semibold">Trạng thái:</span>{" "}
          {profile?.status || "--"}
        </div>
        {/* Nút chỉnh sửa */}
        <div className="flex gap-4 mt-6 justify-center">
          <button
            onClick={() => {
              setEditMode(true);
              setEditProfile(profile);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </section>
    );
  } else if (activeTab === "contact") {
    mainContent = loading ? (
      <Spin />
    ) : (
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-2">Liên lạc</h2>
        <div className="mb-2 text-gray-600">
          Bạn có thể liên hệ với tôi qua:
        </div>
        <div className="text-lg text-blue-700 font-semibold mb-2">
          Số điện thoại: {user?.phoneNumber || "--"}
        </div>
        <div className="text-lg text-blue-700 font-semibold">
          Email: {user?.email || "--"}
        </div>
      </section>
    );
  } else if (activeTab === "messages") {
    mainContent = (
      <section className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-2">Tin nhắn</h2>
        <div className="mb-2 text-gray-600">
          Tính năng này đang phát triển...
        </div>
      </section>
    );
  }

  return (
    <div className="bg-gradient-to-tr from-blue-50 to-blue-200 min-h-screen">
      <Header user={user} />
      <div className="flex justify-center gap-6 py-10 px-2 max-w-7xl mx-auto">
        {/* Sidebar trái */}
        <aside className="bg-white rounded-xl shadow-lg p-6 w-72 flex flex-col items-center">
          <img
            src={
              user?.avatarUrl ||
              "https://randomuser.me/api/portraits/men/32.jpg"
            }
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-blue-400 mb-3 object-cover"
          />
          <div className="font-bold text-lg">{user?.fullName}</div>
          <div className="text-gray-500 text-sm mb-2">
            {user?.gender === "MALE"
              ? "Nam"
              : user?.gender === "FEMALE"
              ? "Nữ"
              : "Khác"}
            {user?.relationshipStatus ? `, ${user.relationshipStatus}` : ""}
          </div>
          <div className="text-gray-500 text-xs mb-2">
            {user?.address || "Chưa cập nhật địa chỉ"}
          </div>
          {/* Menu tab sidebar */}
          <ul className="w-full mt-2 text-blue-700 text-base space-y-2">
            <li
              className={`hover:text-blue-500 cursor-pointer ${
                activeTab === "profile" ? "font-bold underline" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Hồ sơ
            </li>
            <li
              className={`hover:text-blue-500 cursor-pointer ${
                activeTab === "messages" ? "font-bold underline" : ""
              }`}
              onClick={() => setActiveTab("messages")}
            >
              Tin nhắn
            </li>
            <li
              className={`hover:text-blue-500 cursor-pointer ${
                activeTab === "contact" ? "font-bold underline" : ""
              }`}
              onClick={() => setActiveTab("contact")}
            >
              Liên lạc
            </li>
          </ul>
        </aside>
        {/* Giữa: Thông tin động */}
        <main className="flex-1 flex flex-col gap-6">{mainContent}</main>
        {/* Bên phải: bạn bè, cộng đồng (nếu muốn thêm về sau) */}
      </div>
    </div>
  );
}
