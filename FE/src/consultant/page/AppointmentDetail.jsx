import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConsultantHeader from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  // Chưa có API, dùng mock data tạm
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Dữ liệu giả lập
      const fake = {
        id, date: '2025-06-15', time: '14:00', userId: 2, userName: 'Nguyễn Văn A', status: 'PENDING', note: '',
      };
      setAppointment(fake);
      setNote(fake.note);
      setLoading(false);

      // Khi backend có API, thay bằng:
      // api.get(`/consultant/appointments/${id}`).then(res => {
      //   setAppointment(res.data);
      //   setNote(res.data.note || '');
      // });
    }, 500);
  }, [id]);

  // Nếu có userId, có thể gọi API lấy profile user (API đã có)
  useEffect(() => {
    if (appointment?.userId) {
      api.get(`/profile/${appointment.userId}`)
        .then(res => setUserProfile(res.data))
        .catch(() => setUserProfile(null));
    }
  }, [appointment]);

  // Khi backend có API PATCH, thay đổi tương tự
  const handleUpdate = (status) => {
    // Khi backend có API, thay bằng:
    // api.patch(`/consultant/appointments/${id}`, { status, note }).then(...)
    toast.success(`Cập nhật trạng thái: ${status} (fake)`);
    navigate('/consultant/appointments');
  };

  if (loading) return <div>Đang tải chi tiết...</div>;
  if (!appointment) return <div>Không tìm thấy lịch hẹn.</div>;

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Chi tiết lịch hẹn</h2>
        <div className="border rounded p-6 bg-white mb-4">
          <div><b>Ngày:</b> {appointment.date}</div>
          <div><b>Giờ:</b> {appointment.time}</div>
          <div><b>Người dùng:</b> {appointment.userName}</div>
          {userProfile && (
            <div className="my-2 text-sm text-gray-600">
              <b>SĐT:</b> {userProfile.phoneNumber} | <b>Địa chỉ:</b> {userProfile.address}
            </div>
          )}
          <div><b>Trạng thái:</b> {appointment.status}</div>
          <div className="mt-4">
            <label className="block font-semibold mb-2">Ghi chú:</label>
            <textarea
              rows={4}
              className="w-full border rounded p-2"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleUpdate('CONFIRMED')} className="bg-blue-500 text-white px-4 py-2 rounded">Xác nhận</button>
          <button onClick={() => handleUpdate('REJECTED')} className="bg-red-500 text-white px-4 py-2 rounded">Từ chối</button>
          <button onClick={() => handleUpdate(appointment.status)} className="bg-gray-300 px-4 py-2 rounded">Lưu ghi chú</button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AppointmentDetail;