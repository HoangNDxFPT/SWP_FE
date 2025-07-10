import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function ConsultantDetail() {
  const { id } = useParams();
  const [consultant, setConsultant] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState(null);

  // Lấy thông tin tư vấn viên
  useEffect(() => {
    const fetchConsultant = async () => {
      try {
        const res = await api.get(`consultant/public/${id}`);
        setConsultant(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin tư vấn viên:', err);
      }
    };
    fetchConsultant();
  }, [id]);

  // Lấy danh sách khung giờ
  const fetchSlots = async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null); // clear khi tìm lại
    try {
      const res = await api.get(`slot/registered?consultantId=${id}&date=${selectedDate}`);
      setSlots(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách slot:', err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Gửi yêu cầu đặt lịch
  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedDate) return;

    try {
      const res = await api.post('appointment', {
        slotId: selectedSlot.slotId,
        consultantId: parseInt(id),
        appointmentDate: selectedDate
      });

      if (res.status === 200) {
        setAppointmentInfo(res.data);
        toast.success('Đặt lịch thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi đặt lịch:', err);
      alert('Đặt lịch thất bại.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Thông tin tư vấn viên</h2>

      {consultant ? (
        <div className="bg-white rounded shadow p-4 mb-6">
          <p><strong>Họ tên:</strong> {consultant.fullName}</p>
          <p><strong>Bằng cấp:</strong> {consultant.degree || 'Chưa cập nhật'}</p>
          <p><strong>Thông tin thêm:</strong> {consultant.information || 'Chưa cập nhật'}</p>
          <p><strong>Địa chỉ:</strong> {consultant.address}</p>
          <p><strong>Trạng thái:</strong> {consultant.status || 'Chưa cập nhật'}</p>
        </div>
      ) : (
        <p>Đang tải thông tin tư vấn viên...</p>
      )}

      <div className="mb-4">
        <label htmlFor="dateInput" className="block font-medium mb-1">
          Nhập ngày (yyyy-mm-dd):
        </label>
        <input
          id="dateInput"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border px-3 py-2 rounded w-full max-w-xs"
        />
        <button
          onClick={fetchSlots}
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Tìm lịch
        </button>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-2">Khung giờ:</h4>
        {loadingSlots ? (
          <p>Đang tải khung giờ...</p>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
            {slots.map((slot) => (
              <button
                key={slot.slotId}
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-2 rounded text-sm font-medium border transition duration-150 ${
                  slot.slotId === selectedSlot?.slotId
                    ? 'bg-blue-600 text-white'
                    : slot.available
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Không có khung giờ nào khả dụng.</p>
        )}
      </div>

      {selectedSlot && (
        <div className="mt-6">
          <p>
            <strong>Khung giờ đã chọn:</strong> {selectedSlot.label} ({selectedDate})
          </p>
          <button
            onClick={handleBookAppointment}
            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Đặt lịch
          </button>
        </div>
      )}

      {appointmentInfo && (
        <div className="mt-8 bg-green-100 border border-green-300 rounded p-4">
          <h4 className="text-lg font-bold mb-2 text-green-800">Đặt lịch thành công</h4>
          <p><strong>Ngày:</strong> {appointmentInfo.date}</p>
          <p><strong>Thời gian:</strong> {appointmentInfo.startTime} - {appointmentInfo.endTime}</p>
          <p><strong>Trạng thái:</strong> {appointmentInfo.status}</p>
          <p><strong>Google Meet:</strong> <a href={appointmentInfo.googleMeetLink} className="text-blue-700 underline">{appointmentInfo.googleMeetLink}</a></p>
        </div>
      )}
    </div>
  );
}

export default ConsultantDetail;
