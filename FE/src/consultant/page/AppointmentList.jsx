import React, { useEffect, useState } from 'react';
import ConsultantHeader from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chưa có API, dùng mock data tạm
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setAppointments([
        {
          id: 1, date: '2025-06-15', time: '14:00', userId: 2, userName: 'Nguyễn Văn A', status: 'PENDING',
        },
        {
          id: 2, date: '2025-06-16', time: '10:30', userId: 3, userName: 'Trần Thị B', status: 'CONFIRMED',
        },
      ]);
      setLoading(false);
    }, 500);
    // Khi backend có API, thay bằng:
    // api.get('/consultant/appointments').then(res => {
    //   setAppointments(res.data);
    //   setLoading(false);
    // });
  }, []);

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-5xl mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Quản lý lịch hẹn</h2>
        {loading ? (
          <div>Đang tải lịch hẹn...</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Ngày</th>
                <th className="p-2">Giờ</th>
                <th className="p-2">Tên người dùng</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6">Không có lịch hẹn nào.</td>
                </tr>
              )}
              {appointments.map(a => (
                <tr key={a.id}>
                  <td className="p-2">{a.date}</td>
                  <td className="p-2">{a.time}</td>
                  <td className="p-2">{a.userName}</td>
                  <td className="p-2">{a.status}</td>
                  <td className="p-2">
                    <Link to={`/consultant/appointments/${a.id}`}>
                      <button className="text-blue-500 underline">Xem</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
}

export default AppointmentList;