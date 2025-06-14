import { useEffect, useState } from "react";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function Dashboard() {
  const [stats, setStats] = useState({
    currentCases: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  // ĐÂY LÀ DANH SÁCH NGÀY CÓ LỊCH HẸN
  // (Sau này bạn thay bằng API, giữ đúng format yyyy-mm-dd)
  const [appointments, setAppointments] = useState([
    { date: "2025-06-10", title: "Tư vấn cho Nguyễn Văn A" },
    { date: "2025-06-13", title: "Tư vấn cho Trần Thị B" },
    { date: "2025-06-24", title: "Tư vấn cho Lê Văn C" },
  ]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStats({
        currentCases: 3,
        upcomingAppointments: 5,
        todayAppointments: 1,
      });
      setLoading(false);
    }, 500);
    // Khi backend có API, thay bằng:
    // api.get('/consultant/dashboard-summary').then(res => {
    //   setStats(res.data);
    //   setLoading(false);
    // });
  }, []);

  // HÀM ĐÁNH DẤU NGÀY CÓ LỊCH HẸN
  const tileClassName = ({ date, view }) => {
    // Chỉ đánh dấu ngày trong tháng (không đánh dấu tháng/năm)
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      if (appointments.some((app) => app.date === dateStr)) {
        return "react-calendar__tile--hasAppointment";
      }
    }
    return null;
  };

  // HÀM HIỂN THỊ NỘI DUNG LỊCH HẸN KHI CLICK NGÀY (tùy chọn)
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointmentContent, setAppointmentContent] = useState(null);

  const handleDateClick = (value) => {
    const dateStr = value.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    const found = appointments.find((app) => app.date === dateStr);
    setAppointmentContent(found ? found.title : null);
  };

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-6xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">
          Consultant Dashboard
        </h1>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">
                {stats.todayAppointments}
              </div>
              <div className="text-gray-600">Lịch hẹn hôm nay</div>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">
                {stats.upcomingAppointments}
              </div>
              <div className="text-gray-600">Lịch hẹn sắp tới</div>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">
                {stats.currentCases}
              </div>
              <div className="text-gray-600">Hồ sơ đang tư vấn</div>
            </div>
          </div>
        )}

        {/* PHẦN CALENDAR ĐƯỢC THÊM */}
        <div className="mt-10 flex flex-col items-center">
          <Calendar
            tileClassName={tileClassName}
            onClickDay={handleDateClick}
            defaultActiveStartDate={new Date(2025, 5, 1)}
          />
          {/* Hiển thị chú thích màu đánh dấu */}
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-block w-4 h-4 rounded-full bg-yellow-300 border border-yellow-500"></span>
            Ngày có lịch hẹn
          </div>
          {/* Hiển thị nội dung lịch hẹn khi click ngày */}
          {appointmentContent && (
            <div className="mt-2 bg-white border rounded p-2 shadow text-blue-700 font-semibold">
              {selectedDate}: {appointmentContent}
            </div>
          )}
        </div>
      </div>
      <Footer />

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
