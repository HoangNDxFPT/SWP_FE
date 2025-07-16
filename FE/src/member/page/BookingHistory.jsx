import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

// SVG Icons thay vì sử dụng Heroicons
const Icons = {
 Calendar: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Clock: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  User: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  VideoCamera: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  ExclamationCircle: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const TABS = [
  { 
    label: 'Chờ xác nhận', 
    value: 'PENDING', 
    icon: <Icons.Clock className="w-4 h-4" />, 
    color: 'bg-yellow-100 text-yellow-800' 
  },
  { 
    label: 'Hoàn thành', 
    value: 'COMPLETED', 
    icon: <Icons.CheckCircle className="w-4 h-4" />, 
    color: 'bg-green-100 text-green-800' 
  },
  { 
    label: 'Đã hủy', 
    value: 'CANCELLED', 
    icon: <Icons.XCircle className="w-4 h-4" />, 
    color: 'bg-red-100 text-red-800' 
  },
  {
    label: 'Các báo cáo của tôi',
    value: 'MY_REPORTS',
    icon: <Icons.ExclamationCircle className="w-4 h-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
];

function BookingHistory() {
   const [selectedTab, setSelectedTab] = useState('PENDING');
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ appointmentId: null, reason: '', description: '' });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelId, setCancelId] = useState(null);

    const fetchAppointments = async (status) => {
    setLoading(true);
    try {
      const res = await api.get(`appointment/appointments?status=${status}`);
      setAppointments(res.data || []);
    } catch (err) {
      toast.error('Không thể tải lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/report/member/reports`);
      setReports(res.data || []);
    } catch (err) {
      toast.error('Không thể tải báo cáo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === 'MY_REPORTS') {
      fetchMyReports();
    } else {
      fetchAppointments(selectedTab);
    }
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
      toast.error('Gửi báo cáo thất bại!',);
    }
  };

  const handleCancelClick = (appointmentId) => {
    setCancelId(appointmentId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    setShowCancelModal(false);
    if (!cancelId) return;
    try {
      await api.delete(`appointment/appointments/${cancelId}`);
      toast.success('Hủy cuộc hẹn thành công!');
      fetchAppointments(selectedTab);
    } catch (error) {
      toast.error('Hủy cuộc hẹn thất bại!');
    }
    setCancelId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const StatusBadge = ({ status }) => {
    const tabInfo = TABS.find(tab => tab.value === status) || TABS[0];
    return (
      <span className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tabInfo.color} border border-current`}>
        {tabInfo.icon}
        <span className="ml-1">{tabInfo.label}</span>
      </span>
    );
  };
  return (
    <>
      <Header />
      <div className="bg-gray-50 min-h-screen pb-12">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lịch sử đặt hẹn</h1>
              <p className="mt-1 text-sm text-gray-500">Quản lý và theo dõi các buổi tư vấn của bạn</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white shadow-sm rounded-lg mb-8">
            <div className="flex border-b border-gray-200">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTab(tab.value)}
                  className={`
                    flex-1 py-4 px-1 flex items-center justify-center font-medium text-sm
                    ${selectedTab === tab.value 
                      ? `border-b-2 border-blue-500 text-blue-600` 
                      : 'text-gray-500 hover:text-gray-700'}
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-500">Đang tải danh sách lịch hẹn...</p>
            </div>
          ) : selectedTab === 'MY_REPORTS' ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {reports.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center col-span-2">
                  <Icons.ExclamationCircle className="h-16 w-16 text-gray-300 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Bạn chưa gửi báo cáo nào</h3>
                  <p className="mt-2 text-gray-500">Các báo cáo về vấn đề của bạn sẽ hiển thị tại đây.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <Icons.ExclamationCircle className="h-5 w-5 text-blue-500 mr-2" />
                        <h3 className="text-sm font-medium text-gray-700">Báo cáo #{report.id}</h3>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Lý do:</span>
                        <span className="ml-2 text-gray-600">{report.reason}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Chi tiết:</span>
                        <span className="ml-2 text-gray-600">{report.description}</span>
                      </div>
                      <div className="mb-2">
                        <span className="font-medium text-gray-700">Cuộc hẹn liên quan:</span>
                        <span className="ml-2 text-gray-600">#{report.appointmentId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phản hồi từ quản trị viên:</span>
                        <span className="ml-2 text-gray-600">{report.adminNote || "Chưa có phản hồi"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="flex justify-center">
                <Icons.Calendar className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Không có lịch hẹn nào</h3>
              <p className="mt-2 text-gray-500">
                {selectedTab === 'PENDING' && "Bạn chưa có lịch hẹn nào đang chờ xác nhận."}
                {selectedTab === 'COMPLETED' && "Bạn chưa hoàn thành lịch hẹn nào."}
                {selectedTab === 'CANCELLED' && "Bạn chưa hủy lịch hẹn nào."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {appointments.map((appt) => (
                <div 
                  key={appt.id} 
                  className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300"
                >
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <Icons.Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-700">{formatDate(appt.date)}</h3>
                    </div>
                    <StatusBadge status={selectedTab} />
                  </div>
                  
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-start">
                        <Icons.Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Thời gian</p>
                          <p className="text-sm text-gray-500">{appt.startTime} - {appt.endTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Icons.User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tư vấn viên</p>
                          <p className="text-sm text-gray-500">{appt.consultantName || "Chưa được phân công"}</p>
                        </div>
                      </div>
                      
                      {/* Chỉ hiển thị Google Meet link cho các cuộc hẹn đang chờ xác nhận */}
                      {appt.googleMeetLink && selectedTab === 'PENDING' && (
                        <div className="flex items-start">
                          <Icons.VideoCamera className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Liên kết họp</p>
                            <a 
                              href={appt.googleMeetLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Tham gia Google Meet
                            </a>
                          </div>
                        </div>
                      )}

                      {appt.topic && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700 mb-1">Chủ đề tư vấn</p>
                          <p className="text-sm text-gray-600">{appt.topic}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      {selectedTab === 'COMPLETED' && (
                        <button
                          onClick={() => handleOpenReportModal(appt.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Icons.ExclamationCircle className="h-4 w-4 mr-1.5" />
                          Báo cáo vấn đề
                        </button>
                      )}

                      {selectedTab === 'PENDING' && (
                        <button
                          onClick={() => handleCancelClick(appt.id)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Icons.XCircle className="h-4 w-4 mr-1.5" />
                          Hủy cuộc hẹn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Báo cáo vấn đề</h3>
              <p className="mt-1 text-sm text-gray-500">Vui lòng cho chúng tôi biết chi tiết về vấn đề bạn gặp phải</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Lý do báo cáo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="reason"
                    value={reportData.reason}
                    onChange={(e) => setReportData({ ...reportData, reason: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nhập lý do báo cáo"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Chi tiết <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    rows="4"
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải"
                  />
                </div>
              </div>
            </div>
            
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận hủy cuộc hẹn */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Xác nhận hủy cuộc hẹn</h3>
              <p className="mt-1 text-sm text-gray-500">Bạn có chắc muốn hủy cuộc hẹn này không?</p>
            </div>
            <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Không
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Có, hủy cuộc hẹn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookingHistory;
