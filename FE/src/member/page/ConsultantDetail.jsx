import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../config/axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Footer from '../components/Footer';
function ConsultantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // User state
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Go back function
  const goBack = () => {
    navigate(-1);
  };

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const res = await api.get('profile');
        if (res.status === 200 && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch all possible time slots
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        const response = await api.get('/slot');
        if (response.status === 200) {
          setTimeSlotOptions(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch time slots:', err);
        toast.error('Không thể tải danh sách khung giờ');
      }
    };

    fetchTimeSlots();
  }, []);

  // Function to handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedDate) {
        fetchSlots(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedDate]);

  // Add periodic refresh for slot data
  useEffect(() => {
    let refreshTimer;

    if (selectedDate && slots.length > 0) {
      refreshTimer = setInterval(() => {
        fetchSlots(true);
      }, 30000); // 30 seconds
    }

    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [selectedDate, slots.length]);

  // Lấy thông tin tư vấn viên
  useEffect(() => {
    const fetchConsultant = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`consultant/public/${id}`);
        setConsultant(res.data);
      } catch (err) {
        console.error('Lỗi khi lấy thông tin tư vấn viên:', err);
        setError('Không thể tải thông tin tư vấn viên. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultant();
  }, [id]);

  // Lấy danh sách khung giờ
  const fetchSlots = async (forceRefresh = false) => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null); // clear khi tìm lại

    try {
      const timestamp = `&_t=${new Date().getTime()}`;
      const requestId = `&reqId=${Math.random().toString(36).substring(2, 15)}`;
      const res = await api.get(`slot/registered?consultantId=${id}&date=${selectedDate}${timestamp}${requestId}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      const registeredSlotsMap = {};
      res.data.forEach(slot => {
        registeredSlotsMap[slot.slotId] = slot;
      });

      if (timeSlotOptions.length > 0) {
        const allSlots = timeSlotOptions.map(slot => {
          if (registeredSlotsMap[slot.id]) {
            return {
              ...registeredSlotsMap[slot.id],
              slotId: registeredSlotsMap[slot.id].slotId || slot.id,
              label: registeredSlotsMap[slot.id].label || slot.label,
              startTime: registeredSlotsMap[slot.id].startTime || slot.start,
              endTime: registeredSlotsMap[slot.id].endTime || slot.end
            };
          } else {
            return {
              slotId: slot.id,
              label: slot.label,
              startTime: slot.start,
              endTime: slot.end,
              available: false,
              notRegistered: true
            };
          }
        });

        allSlots.sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });

        setSlots(allSlots);
      } else {
        setSlots(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách slot:', err);
      toast.error('Không thể tải danh sách khung giờ. Vui lòng thử lại sau.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Gửi yêu cầu đặt lịch với retry logic
  const handleBookAppointment = async (retryCount = 0) => {
    if (!selectedSlot || !selectedDate) {
      toast.error('Vui lòng chọn ngày và khung giờ');
      return;
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để đặt lịch tư vấn');
      return;
    }

    setBookingInProgress(true);
    try {
      if (retryCount === 0) {
        await fetchSlots(true);

        const refreshedSlot = slots.find(s => s.slotId === selectedSlot.slotId);
        if (!refreshedSlot?.available) {
          toast.error('Khung giờ này không còn khả dụng. Vui lòng chọn khung giờ khác.');
          setBookingInProgress(false);
          return;
        }
      }

      // Debug để xem thông tin slot
      console.log("Selected slot:", selectedSlot);

      // Đảm bảo slotId đúng định dạng (số nguyên)
      const slotId = typeof selectedSlot.slotId === 'string'
        ? parseInt(selectedSlot.slotId, 10)
        : selectedSlot.slotId;

      // Format date đúng chuẩn YYYY-MM-DD
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

      const requestData = {
        slotId: slotId,
        consultantId: id,
        appointmentDate: formattedDate
      };

      console.log("Sending request data:", requestData);

      const res = await api.post('appointment', requestData);

      if (res.status === 200) {
        setAppointmentInfo(res.data);
        toast.success('Đặt lịch thành công!');

        setTimeout(() => {
          navigate('/consultantList', { state: { activeTab: 'appointments' } });
        }, 2000);
      }
    } catch (err) {
      console.error('Lỗi khi đặt lịch:', err);

      // Log response error details
      if (err.response) {
        console.error('Error response:', err.response.data);
      }

      if (retryCount < 2 && err.response?.status === 400) {
        toast.info('Đang cập nhật thông tin khung giờ. Vui lòng đợi...');

        setTimeout(async () => {
          await fetchSlots(true);
          handleBookAppointment(retryCount + 1);
        }, 1500);
        return;
      }

      if (err.response?.status === 400) {
        fetchSlots(true);
        toast.error(err.response?.data?.message || 'Không thể đặt lịch vào khung giờ này. Đã tải lại thông tin khung giờ.');
      } else {
        toast.error(err.response?.data?.message || 'Đặt lịch thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      if (retryCount > 0) {
        setBookingInProgress(false);
      }
    }
  };

  // Lấy ngày hiện tại để giới hạn input date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Thông tin chi tiết tư vấn viên
              </h1>
              <p className="text-lg opacity-90">
                Tìm hiểu thông tin và đặt lịch với chuyên gia tư vấn
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm text-gray-500">
                <li>
                  <Link to="/" className="hover:text-blue-600 transition-colors">
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li>
                  <Link to="/consultantList" className="hover:text-blue-600 transition-colors">
                    Danh sách tư vấn viên
                  </Link>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li className="text-blue-600 font-medium">
                  {loading ? 'Đang tải...' : consultant?.fullName || 'Chi tiết tư vấn viên'}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={goBack}
              className="group flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 mr-2 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </span>
              Trở về
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-gray-600">Đang tải thông tin tư vấn viên...</p>
            </div>
          ) : consultant ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  Thông tin tư vấn viên
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3">
                    {/* Profile Photo */}
                    <div className="mb-6 flex flex-col items-center">
                      <div className="h-40 w-40 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex items-center justify-center text-blue-600 text-6xl font-bold mb-4">
                        {consultant.fullName?.charAt(0) || 'C'}
                      </div>
                      <h3 className="text-xl font-bold text-center text-gray-800">{consultant.fullName}</h3>
                      <p className="text-blue-600 font-medium">{consultant.degree || 'Chuyên viên tư vấn'}</p>
                    </div>

                    {/* Certificate */}
                    {consultant.certifiedDegreeImage && (
                      <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Chứng chỉ
                        </h3>
                        <img
                          src={consultant.certifiedDegreeImage}
                          alt="Chứng chỉ"
                          className="w-full rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(consultant.certifiedDegreeImage, '_blank')}
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">Nhấp vào hình để xem kích thước đầy đủ</p>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-2/3">
                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h4 className="text-sm uppercase tracking-wider text-blue-800 font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Thông tin chung
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Họ tên:</span>
                            <p className="text-gray-800 font-medium">{consultant.fullName}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Bằng cấp:</span>
                            <p className="text-gray-800">{consultant.degree || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                        <h4 className="text-sm uppercase tracking-wider text-indigo-800 font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Thông tin liên hệ
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Địa chỉ:</span>
                            <p className="text-gray-800">{consultant.address || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="text-sm uppercase tracking-wider text-gray-700 font-semibold mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Thông tin chuyên môn
                      </h4>
                      <div className="prose max-w-none text-gray-700">
                        <p className="whitespace-pre-line">{consultant.information || 'Chưa cập nhật thông tin chuyên môn.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Booking Section */}
          {!loading && !error && (
            <>
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Đặt lịch tư vấn
                  </h3>
                </div>

                <div className="p-6">
                  {loadingUser ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="mt-3 text-gray-600">Đang kiểm tra thông tin đăng nhập...</p>
                    </div>
                  ) : !user ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <svg className="h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-yellow-800 mb-2">Bạn cần đăng nhập để đặt lịch</h4>
                      <p className="text-yellow-700 mb-6">Vui lòng đăng nhập hoặc đăng ký tài khoản để sử dụng tính năng đặt lịch tư vấn.</p>
                      <Link
                        to="/login"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Đăng nhập ngay
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="flex items-center text-blue-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Đang đặt lịch với tư cách: <span className="font-medium ml-1">{user.fullName || user.userName}</span>
                        </p>
                      </div>

                      <div className="bg-gray-50 p-5 rounded-xl mb-6">
                        <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Chọn ngày và tìm lịch trống
                        </h4>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-grow">
                            <label htmlFor="dateInput" className="block text-sm font-medium text-gray-700 mb-1">
                              Chọn ngày:
                            </label>
                            <input
                              id="dateInput"
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              min={getTodayDate()}
                              className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="self-end">
                            <button
                              onClick={() => fetchSlots()}
                              disabled={!selectedDate}
                              className={`w-full sm:w-auto px-4 py-2.5 rounded-md font-medium text-white
                                ${selectedDate
                                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                  : 'bg-blue-300 cursor-not-allowed'}`}
                            >
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Tìm lịch trống
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {selectedDate && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-medium text-gray-800 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Khung giờ ngày {formatDate(selectedDate)}:
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => fetchSlots(true)}
                                className="text-sm flex items-center text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Làm mới
                              </button>
                              {selectedSlot && (
                                <button
                                  onClick={() => {
                                    setSelectedSlot(null);
                                    fetchSlots(true);
                                  }}
                                  className="text-sm flex items-center text-gray-600 hover:text-gray-800 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Hủy chọn
                                </button>
                              )}
                            </div>
                          </div>

                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-10">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                              <p className="text-gray-600">Đang tải khung giờ...</p>
                            </div>
                          ) : slots.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                              {slots.map((slot) => (
                                <button
                                  key={slot.slotId}
                                  disabled={!slot.available}
                                  onClick={() => {
                                    setSelectedSlot(null);
                                    setTimeout(() => setSelectedSlot(slot), 50);
                                  }}
                                  className={`px-4 py-3 rounded-md text-sm font-medium border transition duration-150 ${slot.slotId === selectedSlot?.slotId
                                      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-200'
                                      : slot.available
                                        ? 'bg-white text-green-700 border-green-500 hover:bg-green-50'
                                        : slot.notRegistered
                                          ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                                          : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    }`}
                                >
                                  {slot.label}
                                  {!slot.available && !slot.notRegistered &&
                                    <span className="block text-xs mt-1">Đã đặt</span>
                                  }
                                  {slot.notRegistered &&
                                    <span className="block text-xs mt-1">Không khả dụng</span>
                                  }
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center bg-gray-50 rounded-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-500">Không có khung giờ nào khả dụng cho ngày này.</p>
                              <p className="text-sm text-gray-500 mt-1">Vui lòng chọn ngày khác.</p>
                            </div>
                          )}

                          {selectedSlot && (
                            <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
                              <div className="flex items-center mb-4 text-blue-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <h4 className="text-xl font-bold">Xác nhận đặt lịch</h4>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-blue-100 mb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Tư vấn viên:</span>
                                    <p className="text-gray-800 font-medium">{consultant?.fullName}</p>
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Người đặt:</span>
                                    <p className="text-gray-800 font-medium">{user.fullName || user.userName}</p>
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Ngày:</span>
                                    <p className="text-gray-800">{formatDate(selectedDate)}</p>
                                  </div>
                                  <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Khung giờ:</span>
                                    <p className="text-gray-800 bg-blue-50 inline-block px-2 py-0.5 rounded">{selectedSlot.label}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleBookAppointment()}
                                  disabled={bookingInProgress}
                                  className={`px-6 py-2.5 rounded-lg font-medium text-white transition duration-150 ${bookingInProgress
                                      ? 'bg-blue-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow'
                                    }`}
                                >
                                  {bookingInProgress ? (
                                    <span className="flex items-center justify-center">
                                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                                      Đang xử lý...
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Xác nhận đặt lịch
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Success Section */}
              {appointmentInfo && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                    <div className="flex items-center">
                      <div className="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-bold text-white">Đặt lịch thành công</h4>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="bg-green-50 rounded-xl p-5 border border-green-200 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Tư vấn viên:</span>
                          <p className="text-gray-800 font-semibold">{consultant?.fullName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Người đặt:</span>
                          <p className="text-gray-800 font-semibold">{user?.fullName || user?.userName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Ngày:</span>
                          <p className="text-gray-800">{formatDate(appointmentInfo.date)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Thời gian:</span>
                          <p className="text-gray-800">{appointmentInfo.startTime} - {appointmentInfo.endTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-4 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Link Google Meet
                      </h5>
                      <a
                        href={appointmentInfo.googleMeetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white border border-gray-200 rounded-lg p-4 text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        {appointmentInfo.googleMeetLink || "Chưa có link Google Meet"}
                      </a>
                      <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-blue-700">
                          Bạn sẽ sử dụng link Google Meet này để tham gia buổi tư vấn vào ngày và giờ đã đặt. Vui lòng lưu lại link này hoặc truy cập phần "Lịch hẹn của tôi" để xem lại thông tin chi tiết.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center mt-6">
                      <Link
                        to="/consultantList"
                        state={{ activeTab: 'appointments' }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Xem lịch hẹn của tôi
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}

export default ConsultantDetail;
