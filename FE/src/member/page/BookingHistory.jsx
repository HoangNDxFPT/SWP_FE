import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../../config/axios';
import { toast } from 'react-toastify';

const TABS = [
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

function BookingHistory() {
  const [selectedTab, setSelectedTab] = useState('PENDING');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ appointmentId: null, reason: '', description: '' });

  const fetchAppointments = async (status) => {
    setLoading(true);
    try {
      const res = await api.get(`appointment/appointments?status=${status}`);
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', err);
      toast.error('Không thể tải lịch hẹn. Vui lòng thử lại sau.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(selectedTab);
  }, [selectedTab]);

  const handleOpenReportModal = (id) => {
    setReportData({ appointmentId: id, reason: '', description: '' });
    setShowReportModal(true);
  };

  const handleReportSubmit = async () => {
    const { appointmentId, reason, description } = reportData;
    if (!reason || !description) {
      toast.error('Vui lòng nhập đầy đủ lý do và mô tả!');
      return;
    }

    try {
      await api.post(`report?appointmentId=${appointmentId}&reason=${encodeURIComponent(reason)}&description=${encodeURIComponent(description)}`);
      toast.success('Báo cáo thành công!');
      setShowReportModal(false);
    } catch (error) {
      toast.error('Gửi báo cáo thất bại!');
      console.error(error);
    }
  };
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Bạn có chắc muốn hủy cuộc hẹn này không?')) return;

    try {
      await api.delete(`appointment/appointments/${appointmentId}`);
      toast.success('Hủy cuộc hẹn thành công!');
      fetchAppointments(selectedTab); 
    } catch (error) {
      toast.error('Hủy cuộc hẹn thất bại!');
      console.error(error);
    }
  };


  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Lịch sử đặt hẹn</h2>
        <div className="flex space-x-4 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-2 rounded font-semibold ${selectedTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500">Không có lịch hẹn nào ở trạng thái này.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((appt) => (
              <div key={appt.id} className="border rounded p-4 shadow-sm bg-white hover:shadow-md transition">
                <p><strong>Ngày hẹn:</strong> {appt.date}</p>
                <p><strong>Thời gian:</strong> {appt.startTime} - {appt.endTime}</p>
                <p><strong>Tư vấn viên:</strong> {appt.consultantName}</p>
                <p>
                  <strong>Google Meet:</strong>{' '}
                  <a href={appt.googleMeetLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {appt.googleMeetLink}
                  </a>
                </p>

                {selectedTab === 'COMPLETED' && (
                  <button
                    onClick={() => handleOpenReportModal(appt.id)}
                    className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Báo cáo
                  </button>
                )}

                {selectedTab === 'PENDING' && (
                  <button
                    onClick={() => handleCancelAppointment(appt.id)}
                    className="mt-3 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Hủy cuộc hẹn
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-lg font-semibold mb-4">Báo cáo cuộc hẹn</h3>
            <label className="block mb-2">Lý do:</label>
            <input
              type="text"
              value={reportData.reason}
              onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <label className="block mb-2">Mô tả:</label>
            <textarea
              rows="4"
              value={reportData.description}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleReportSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookingHistory;
