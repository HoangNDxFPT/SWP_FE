import { useEffect, useState } from "react";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";

function Dashboard() {
  const [stats, setStats] = useState({
    currentCases: 0,
    upcomingAppointments: 0,
    todayAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  // Chưa có API backend, dùng mock data tạm
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

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-6xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Consultant Dashboard</h1>
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">{stats.todayAppointments}</div>
              <div className="text-gray-600">Lịch hẹn hôm nay</div>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">{stats.upcomingAppointments}</div>
              <div className="text-gray-600">Lịch hẹn sắp tới</div>
            </div>
            <div className="bg-white rounded shadow p-6 flex flex-col items-center">
              <div className="text-2xl font-semibold text-blue-700">{stats.currentCases}</div>
              <div className="text-gray-600">Hồ sơ đang tư vấn</div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Dashboard;