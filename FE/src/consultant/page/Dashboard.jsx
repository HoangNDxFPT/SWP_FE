import { useEffect, useState } from "react";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import api from "../../config/axios";
import "../components/style.css"; // Import custom styles for calendar


import { AnimatePresence,motion } from "framer-motion";
import PrettyCalendar from "../../components/PrettyCalendar";

function Dashboard() {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmed: 0,
    pending: 0,
    rejected: 0,
    completed: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const dashboardRes = await api.get("/consultant/dashboard");
        setStats(dashboardRes.data);

        const appointmentsRes = await api.get("/consultant/appointments");
        const appts = appointmentsRes.data.map((item) => ({
          date: item.appointmentTime.split("T")[0], // Chỉ lấy ngày (YYYY-MM-DD
          title: `(${item.status}) Tư vấn cho ${item.userFullName}`, // Tiêu đề lịch hẹn
          status: item.status, // Trạng thái lịch hẹn
          fullName: item.userFullName, // Tên người dùng
          userId: item.userId, // ID người dùng
          email: item.userEmail, // Email người dùng
          note: item.note, // Ghi chú (nếu có)
          phone: item.userPhone, // Số điện thoại người dùng
        }));
        setAppointments(appts);
      } catch (error) {
        // Xử lý lỗi nếu cần
        setStats({
          totalAppointments: 0,
          confirmed: 0,
          pending: 0,
          rejected: 0,
          completed: 0,
        });
        setAppointments([]);
        console.error("Error fetching dashboard data:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, []);
  // HÀM TÍNH TOÁN SỐ LƯỢNG LỊCH HẸN TRONG NGÀY

  // HÀM ĐÁNH DẤU NGÀY CÓ LỊCH HẸN
  const tileClassName = ({ date, view }) => {
    // Chỉ đánh dấu ngày trong tháng (không đánh dấu tháng/năm)
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const found = appointments.find((app) => app.date === dateStr);
      if (found) {
        if (found.status === "PENDING") return "calendar-pending";
        if (found.status === "CONFIRMED") return "calendar-confirmed";
        if (found.status === "REJECTED") return "calendar-rejected";
        if (found.status === "COMPLETED") return "calendar-completed";
        return "calendar-other";
      }
    }
    return null;
  };

 

  const statsBoxes = [
    {
      key: "totalAppointments",
      label: "Tổng số lịch hẹn",
      icon: "📅",
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    {
      key: "pending",
      label: "Lịch hẹn chờ xác nhận",
      icon: "⏳",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    },
    {
      key: "confirmed",
      label: "Lịch hẹn đã xác nhận",
      icon: "✅",
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      key: "completed",
      label: "Lịch hẹn đã hoàn thành",
      icon: "🎉",
      color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    },
    {
      key: "rejected",
      label: "Lịch hẹn bị từ chối",
      icon: "❌",
      color: "bg-red-100 text-red-700 border-red-300",
    },
  ];
  const filteredAppointments = (type) => {
    if (type === "totalAppointments") return appointments;
    return appointments.filter(
      (a) => a.status?.toUpperCase() === type.toUpperCase()
    );
  };

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-6xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-blue-700">
          Consultant Dashboard
        </h1>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mb-10">
            {statsBoxes.map((box) => (
              <motion.div
                whileHover={{
                  scale: 1.07,
                  boxShadow: "0 8px 32px rgba(0,0,0,.15)",
                }}
                whileTap={{ scale: 0.98 }}
                key={box.key}
                className={`cursor-pointer rounded-xl border-2 shadow transition-all duration-300 flex flex-col items-center py-6 ${box.color}`}
                onClick={() => {
                  setModalType(box.key);
                  setShowModal(true);
                }}
              >
                <div className="text-4xl mb-2">{box.icon}</div>
                <div className="text-3xl font-bold mb-1">{stats[box.key]}</div>
                <div className="text-base font-semibold text-center">
                  {box.label}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex w-full max-w-5xl mx-auto mt-10 gap-8 items-center">
          {/* Cột trái: Calendar to, không có khung ngoài */}
          <div className="flex-1 flex flex-col items-center">
            <PrettyCalendar appointments={appointments} />
          </div>
          {/* Cột phải: Ảnh minh họa */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src="https://cdn.pixabay.com/photo/2016/03/23/18/41/calendar-1275962_1280.png"
              alt="Minh họa lịch hẹn"
              className="w-full max-w-[350px] rounded-2xl shadow"
            />
            {/* Hoặc nội dung bạn muốn */}
          </div>
        </div>
      </div>
      <Footer />

      {/* MODAL HIỂN THỊ DANH SÁCH LỊCH HẸN khi click từng box */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-[600px] min-w-[400px] text-lg relative"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
                aria-label="Close"
              >
                ×
              </button>
              <div className="text-xl font-bold mb-4 text-blue-700">
                {statsBoxes.find((b) => b.key === modalType)?.label}
              </div>
              <div className="max-h-72 overflow-y-auto space-y-4">
                {filteredAppointments(modalType).length === 0 ? (
                  <div className="text-gray-500 text-center">
                    Không có lịch hẹn nào.
                  </div>
                ) : (
                  filteredAppointments(modalType).map((app, idx) => (
                    <motion.div
                      key={app.id || idx}
                      className={`rounded border p-3 shadow bg-gray-50`}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <div>
                        <b>Họ tên:</b> {app.fullName}
                      </div>
                      <div>
                        <b>Email:</b> {app.email}
                      </div>
                      <div>
                        <b>Thời gian:</b> {app.date} {app.time}
                      </div>
                      <div>
                        <b>SĐT:</b> {app.phone} {app.phone}
                      </div>
                      <div>
                        <b>Ghi chú:</b>{" "}
                        {app.note || (
                          <span className="italic text-gray-400">Không có</span>
                        )}
                      </div>
                      <div className="text-xs text-right text-blue-400 mt-1">
                        {app.status}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Style cho calendar theo trạng thái */}
      <style>
        {`
          
       
          .react-calendar__tile--hasAppointment {
            background: #fde047 !important; /* yellow */
            color: #1e40af !important;      /* blue */
            font-weight: bold;
            border-radius: 50%;
            border: 2px solid #facc15;
          }
        `}
      </style>
    </>
  );
}

export default Dashboard;
