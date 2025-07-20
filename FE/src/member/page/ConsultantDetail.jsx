import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaUser, FaCertificate, FaCalendarAlt, FaClock, FaVideo, FaArrowLeft, FaCheck } from 'react-icons/fa';

function ConsultantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(true);
  const [consultant, setConsultant] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [appointmentInfo, setAppointmentInfo] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch consultant and user data
        const [consultantRes, userRes] = await Promise.all([
          api.get(`consultant/public/${id}`),
          api.get('profile').catch(() => ({ data: null }))
        ]);
        
        setConsultant(consultantRes.data);
        setUser(userRes.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Không thể tải thông tin tư vấn viên');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch available slots
  const fetchSlots = async () => {
    if (!selectedDate) return;
    
    try {
      setLoadingSlots(true);
      setSelectedSlot(null);
      
      // Get all time slots and registered slots
      const [timeSlotsRes, registeredSlotsRes] = await Promise.all([
        api.get('/slot'),
        api.get(`slot/registered?consultantId=${id}&date=${selectedDate}&_t=${Date.now()}`)
      ]);
      
      // Map registered slots
      const registeredMap = {};
      registeredSlotsRes.data.forEach(slot => {
        registeredMap[slot.slotId] = slot;
      });
      
      // Combine all slots with availability
      const allSlots = timeSlotsRes.data.map(slot => ({
        slotId: slot.id,
        label: slot.label,
        startTime: slot.start,
        endTime: slot.end,
        available: registeredMap[slot.id]?.available || false,
        isRegistered: !!registeredMap[slot.id]
      }));
      
      // Sort by start time
      allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(allSlots);
      
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Không thể tải danh sách khung giờ');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle booking
  const handleBookAppointment = async () => {
    if (!selectedSlot || !selectedDate || !user) {
      toast.error('Vui lòng đăng nhập và chọn ngày, khung giờ');
      return;
    }

    try {
      setBookingInProgress(true);
      
      // Verify slot is still available
      await fetchSlots();
      const currentSlot = slots.find(s => s.slotId === selectedSlot.slotId);
      if (!currentSlot?.available) {
        toast.error('Khung giờ không còn khả dụng. Vui lòng chọn khung giờ khác.');
        return;
      }

      const requestData = {
        slotId: selectedSlot.slotId,
        consultantId: parseInt(id),
        appointmentDate: new Date(selectedDate).toISOString().split('T')[0]
      };

      const response = await api.post('appointment', requestData);
      
      if (response.status === 200) {
        setAppointmentInfo(response.data);
        toast.success('Đặt lịch thành công!');
      }
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      const message = error.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại.';
      toast.error(message);
      
      if (error.response?.status === 400) {
        await fetchSlots(); // Refresh slots on conflict
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  // Helper functions
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin tư vấn viên...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy tư vấn viên</h3>
            <p className="text-gray-500 mb-4">Tư vấn viên không tồn tại hoặc đã bị xóa.</p>
            <Link to="/consultantList" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <FaArrowLeft className="mr-2" />
              Quay lại danh sách
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/dashboard" className="text-blue-600 hover:text-blue-800">Trang chủ</Link></li>
              <li className="text-gray-400">/</li>
              <li><Link to="/consultantList" className="text-blue-600 hover:text-blue-800">Danh sách tư vấn viên</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-600">{consultant.fullName}</li>
            </ol>
          </nav>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Quay lại
          </button>

          {/* Consultant Info */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl font-bold">
                    {consultant.fullName?.charAt(0) || 'C'}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h1 className="text-2xl font-bold mb-2">{consultant.fullName}</h1>
                  <p className="text-blue-100 mb-3">{consultant.degree || 'Chuyên viên tư vấn'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <FaUser className="mr-2" />
                      <span>Tư vấn viên chuyên nghiệp</span>
                    </div>
                    {consultant.certifiedDegreeImage && (
                      <div className="flex items-center">
                        <FaCertificate className="mr-2" />
                        <span>Đã xác thực bằng cấp</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Họ tên:</span>
                      <p className="font-medium">{consultant.fullName}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Bằng cấp:</span>
                      <p className="font-medium">{consultant.degree || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Địa chỉ:</span>
                      <p className="font-medium">{consultant.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>

                {/* Certificate */}
                {consultant.certifiedDegreeImage && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Chứng chỉ</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <img
                        src={consultant.certifiedDegreeImage}
                        alt="Chứng chỉ"
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        onClick={() => window.open(consultant.certifiedDegreeImage, '_blank')}
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Nhấp để xem kích thước đầy đủ
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Info */}
              {consultant.information && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Thông tin chuyên môn</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-line text-gray-700">{consultant.information}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6">
              <h2 className="text-xl font-bold flex items-center">
                <FaCalendarAlt className="mr-2" />
                Đặt lịch tư vấn
              </h2>
            </div>

            <div className="p-6">
              {!user ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <div className="text-yellow-600 text-4xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Bạn cần đăng nhập</h3>
                  <p className="text-yellow-700 mb-4">Vui lòng đăng nhập để sử dụng tính năng đặt lịch tư vấn.</p>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : appointmentInfo ? (
                /* Success State */
                <div className="text-center">
                  <div className="text-green-500 text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Đặt lịch thành công!</h3>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <span className="text-sm text-gray-600">Tư vấn viên:</span>
                        <p className="font-semibold">{consultant.fullName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ngày:</span>
                        <p className="font-semibold">{formatDate(appointmentInfo.appointmentDate || selectedDate)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Thời gian:</span>
                        <p className="font-semibold">{appointmentInfo.startTime} - {appointmentInfo.endTime}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Link tư vấn:</span>
                        <a 
                          href={appointmentInfo.googleMeetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Google Meet
                        </a>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/consultantList"
                    state={{ activeTab: 'appointments' }}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FaCalendarAlt className="mr-2" />
                    Xem lịch hẹn của tôi
                  </Link>
                </div>
              ) : (
                /* Booking Form */
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-700">
                      Đang đặt lịch với: <span className="font-semibold">{user.fullName || user.userName}</span>
                    </p>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn ngày:
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getTodayDate()}
                        className="border border-gray-300 px-3 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={fetchSlots}
                        disabled={!selectedDate}
                        className={`px-4 py-2 rounded-md font-medium text-white ${
                          selectedDate
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Tìm khung giờ
                      </button>
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">
                          Khung giờ ngày {formatDate(selectedDate)}
                        </h3>
                        <button
                          onClick={fetchSlots}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          🔄 Làm mới
                        </button>
                      </div>

                      {loadingSlots ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Đang tải khung giờ...</p>
                        </div>
                      ) : slots.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {slots.map((slot) => (
                            <button
                              key={slot.slotId}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 rounded-md text-sm font-medium border transition ${
                                selectedSlot?.slotId === slot.slotId
                                  ? 'bg-blue-600 text-white border-blue-700'
                                  : slot.available
                                  ? 'bg-white text-green-700 border-green-500 hover:bg-green-50'
                                  : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                <FaClock className="mr-1" />
                                {slot.label}
                              </div>
                              {!slot.available && (
                                <div className="text-xs mt-1">
                                  {slot.isRegistered ? 'Đã đặt' : ''}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">Không có khung giờ khả dụng cho ngày này</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Booking Confirmation */}
                  {selectedSlot && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4">Xác nhận đặt lịch</h3>
                      
                      <div className="bg-white p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">Tư vấn viên:</span>
                            <p className="font-semibold">{consultant.fullName}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Ngày:</span>
                            <p className="font-semibold">{formatDate(selectedDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Khung giờ:</span>
                            <p className="font-semibold">{selectedSlot.label}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Phương thức:</span>
                            <p className="font-semibold flex items-center">
                              <FaVideo className="mr-1" />
                              Google Meet
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleBookAppointment}
                        disabled={bookingInProgress}
                        className={`w-full py-3 rounded-md font-medium text-white transition ${
                          bookingInProgress
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {bookingInProgress ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Đang xử lý...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <FaCheck className="mr-2" />
                            Xác nhận đặt lịch
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default ConsultantDetail;
