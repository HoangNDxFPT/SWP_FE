import React from "react";
import Header from "../components/Header";

export default function ProfilePage({ user, friends = [], communities = [], testimonials = [] }) {
  return (
    <div className="bg-gradient-to-tr from-blue-50 to-blue-200 min-h-screen">
      <Header user={user} />
      <div className="flex justify-center gap-6 py-10 px-2 max-w-7xl mx-auto">
        {/* Sidebar trái */}
        <aside className="bg-white rounded-xl shadow-lg p-6 w-72 flex flex-col items-center">
          <img
            src={user?.avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-blue-400 mb-3 object-cover"
          />
          <div className="font-bold text-lg">{user?.fullName}</div>
          <div className="text-gray-500 text-sm mb-2">
            {user?.gender === "MALE" ? "Nam" : user?.gender === "FEMALE" ? "Nữ" : "Khác"}{user?.relationshipStatus ? `, ${user.relationshipStatus}` : ""}
          </div>
          <div className="text-gray-500 text-xs mb-2">{user?.address || "Chưa cập nhật địa chỉ"}</div>
          <button className="my-2 bg-blue-100 text-blue-600 px-4 py-1 rounded-full font-semibold">Kết bạn</button>
          
          <ul className="w-full mt-2 text-blue-700 text-base space-y-2">
            <li className="hover:text-blue-500 cursor-pointer">Hồ sơ</li>
            <li className="hover:text-blue-500 cursor-pointer">Tin nhắn</li>
            <li className="hover:text-blue-500 cursor-pointer">Liên lạc</li>
          </ul>
        </aside>
        {/* Giữa: Thông tin chính */}
        <main className="flex-1 flex flex-col gap-6">
          {/* Info chính */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-1">{user?.fullName}</h2>
            <div className="mb-2 text-gray-500">{user?.bio || "Mô tả bản thân..."}</div>
            {/* Chỉ số badge */}
            <div className="flex gap-6 mb-2">
              <div>🌟 {user?.fans || 0} người thích</div>
              <div>😊 {user?.trust || 0} tin cậy</div>
              <div>👍 {user?.legal || 0} thân thiện</div>
              
            </div>
            <div className="text-sm text-gray-500">Tình trạng: {user?.relationshipStatus || "Chưa cập nhật"}</div>
            <div className="mt-2">
              <span className="font-semibold">Địa chỉ:</span> {user?.address || "Chưa cập nhật"}
            </div>
            {/* Tag sở thích */}
            <div className="flex flex-wrap gap-2 mt-2">
              {(user?.musics || []).map((m, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">{m}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(user?.films || []).map((m, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs">{m}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(user?.books || []).map((m, idx) => (
                <span key={idx} className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-xs">{m}</span>
              ))}
            </div>
          </section>
          {/* Feedback */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold mb-2 text-base">Feedback({testimonials.length})</h3>
            {testimonials.map((t, idx) => (
              <div key={idx} className="mb-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <img src={t.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <span className="font-semibold">{t.name}</span>
                </div>
                <div className="text-gray-600 text-sm">{t.text}</div>
              </div>
            ))}
          </section>
        </main>
        {/* Sidebar phải: bạn bè & cộng đồng */}
        <aside className="w-72 flex flex-col gap-6">
          {/* Bạn bè */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="font-bold mb-2">
              Bạn bè ({friends.length}) <span className="text-blue-500 cursor-pointer text-xs float-right">Xem tất cả</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {friends.slice(0, 12).map((f, idx) => (
                <img key={idx} src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
              ))}
            </div>
          </div>
          {/* Cộng đồng */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="font-bold mb-2">
              Cộng đồng ({communities.length}) <span className="text-blue-500 cursor-pointer text-xs float-right">Xem tất cả</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {communities.slice(0, 8).map((c, idx) => (
                <img key={idx} src={c.avatar} alt={c.name} className="w-10 h-10 rounded object-cover border-2 border-gray-200" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
