import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';
import { toast } from 'react-toastify';

const TIME_OPTIONS = [
  { value: '07:00', label: '07:00 - 07:45' },
  { value: '08:00', label: '08:00 - 08:45' },
  { value: '09:00', label: '09:00 - 09:45' },
  { value: '10:00', label: '10:00 - 10:45' },
  { value: '11:00', label: '11:00 - 11:45' },
  { value: '14:00', label: '14:00 - 14:45' },
  { value: '15:00', label: '15:00 - 15:45' },
  { value: '16:00', label: '16:00 - 16:45' },
];

function ConsultantDetail() {
  const { id } = useParams();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [userId, setUserId] = useState(null);

  // Lấy thông tin tư vấn viên
  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        const res = await api.get(`/consultant/profile/${id}`);
        setConsultant(res.data);
      } catch (err) {
        console.error('Lỗi lấy tư vấn viên:', err);
        toast.error('Không thể tải thông tin tư vấn viên!');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/profile');
        setUserId(res.data.userId);
      } catch (err) {
        console.error('Lỗi lấy user profile:', err);
        toast.error('Không thể lấy thông tin người dùng!');
      }
    };

    fetchConsultant();
    fetchUserProfile();
  }, [id]);

  // Demo: Giả lập slot trống theo ngày
  useEffect(() => {
    if (selectedDate) {
      const demoSlots = TIME_OPTIONS.map(opt => ({
        time: opt.value,
        label: opt.label,
        available: Math.random() > 0.5, // Random trạng thái còn trống
      }));
      setAvailableSlots(demoSlots);
      setSelectedTime('');
    }
  }, [selectedDate]);

  const handleBooking = async () => {
    if (!userId || !selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn đầy đủ ngày và khung giờ!');
      return;
    }

    const appointmentTimeISO = `${selectedDate}T${selectedTime}:00.000Z`;

    const payload = {
      userId: userId,
      fullName: consultant.fullName,
      appointmentTime: appointmentTimeISO,
      note: 'Đặt lịch tư vấn',
    };

    try {
      const res = await api.post('consultant/appointments', payload);
      if (res.status === 200) {
        toast.success('Đặt lịch thành công!');
      } else {
        toast.error('Đặt lịch thất bại!');
      }
    } catch (err) {
      console.error('Lỗi đặt lịch:', err);
      toast.error('Có lỗi khi đặt lịch!');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải thông tin...</div>;

  if (!consultant) return <div className="text-center text-red-500 mt-10">Không tìm thấy tư vấn viên.</div>;

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Thông tin tư vấn viên */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">{consultant.fullName}</h1>
          <p><strong>Điện thoại:</strong> {consultant.phoneNumber}</p>
          <p><strong>Địa chỉ:</strong> {consultant.address}</p>
          <p><strong>Bằng cấp:</strong> {consultant.degree || 'Chưa cập nhật'}</p>
          <p><strong>Thông tin thêm:</strong> {consultant.information || 'Chưa cập nhật'}</p>

          {consultant.certifiedDegreeImage && (
            <img
              src={consultant.certifiedDegreeImage}
              alt="Bằng cấp"
              className="mt-4 max-w-sm rounded shadow"
            />
          )}
        </div>

        {/* Bộ lọc lịch */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Lịch trống (Demo)</h2>

          {/* Chọn ngày */}
          <input
            type="date"
            className="border rounded px-4 py-2 mb-4"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />

          {/* Chọn giờ */}
          {selectedDate && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {availableSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`px-3 py-2 text-center rounded font-semibold text-sm transition ${
                    slot.available
                      ? (selectedTime === slot.time
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-500 text-white hover:bg-green-600')
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}

          {/* Nút đặt lịch */}
          {selectedTime && (
            <button
              onClick={handleBooking}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Đặt lịch tư vấn
            </button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ConsultantDetail;
