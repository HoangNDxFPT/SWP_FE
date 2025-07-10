import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

const SPECIALTIES = [
  { value: 'all', label: 'Tất cả chuyên môn' },
  { value: 'psychology', label: 'Tâm lý học' },
  { value: 'psychiatry', label: 'Tâm thần học' },
  { value: 'counseling', label: 'Tư vấn' },
  { value: 'socialWork', label: 'Công tác xã hội' },
];

function ConsultantList() {
  const [consultants, setConsultants] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tính toán ngày hôm nay để làm giá trị tối thiểu cho input date
  const today = new Date().toISOString().split('T')[0];

  // Fetch consultants
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('consultant/all');
        if (res.status === 200) {
          setConsultants(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch consultants:', err);
        setError('Không thể tải danh sách chuyên viên tư vấn');
        toast.error('Không thể tải danh sách chuyên viên tư vấn');
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  // Fetch schedules
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!date) return;

      try {
        const allSchedules = [];
        for (const consultant of consultants) {
          const res = await api.get('/slot/registered', {
            params: {
              consultantId: consultant.id,
              date: date
            }
          });
          if (res.status === 200) {
            allSchedules.push({
              consultantId: consultant.id,
              slots: res.data
            });
          }
        }
        setSchedules(allSchedules);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        toast.error('Không thể tải lịch làm việc');
      }
    };

    if (consultants.length > 0) {
      fetchAvailableSlots();
    }
  }, [consultants, date]);

  const formatTimeSlot = (timeStr) => timeStr?.substring(0, 5);

  // Reset các bộ lọc
  const resetFilters = () => {
    setSearch('');
    setDate('');
    setTime('');
    setSpecialty('all');
  };

  // Lọc danh sách chuyên viên
  const filteredConsultants = consultants.filter(c => {
    // Lọc theo tên
    const matchName = c.fullName?.toLowerCase().includes(search.toLowerCase());

    // Lọc theo chuyên môn
    const matchSpecialty = specialty === 'all' ||
      c.specialty?.toLowerCase().includes(specialty.toLowerCase());

    // Nếu không chọn ngày hoặc thời gian, chỉ lọc theo tên và chuyên môn
    if (!date || !time) return matchName && matchSpecialty;

    // Lọc thêm theo lịch làm việc nếu đã chọn cả ngày và thời gian
    const matchedSchedule = schedules.find(s => s.consultantId === c.id);
    const matchedSlot = matchedSchedule?.slots.find(slot =>
      formatTimeSlot(slot.startTime) === time && slot.available
    );

    return matchName && matchSpecialty && matchedSlot?.isAvailable;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Đội ngũ chuyên viên tư vấn</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Kết nối với các chuyên gia tâm lý, tư vấn và công tác xã hội có kinh nghiệm trong lĩnh vực phòng chống và điều trị các vấn đề liên quan đến ma túy.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Tìm chuyên viên tư vấn</h2>
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xóa bộ lọc
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên chuyên viên</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập tên..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên môn</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
              >
                {SPECIALTIES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tư vấn</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={today}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Khung giờ</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={time}
                onChange={e => setTime(e.target.value)}
                disabled={!date}
              >
                <option value="">Chọn khung giờ</option>
                {TIME_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {date && time && (
            <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đang hiển thị các chuyên viên có lịch trống vào ngày {new Date(date).toLocaleDateString('vi-VN')} lúc {time}
              </p>
            </div>
          )}
        </div>

        {/* Results Stats */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Danh sách chuyên viên tư vấn
            {!loading && (
              <span className="text-gray-500 font-normal ml-2 text-lg">
                ({filteredConsultants.length} kết quả)
              </span>
            )}
          </h2>
        </div>

        {/* Consultant Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-10 rounded-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium mb-2">Rất tiếc, đã xảy ra lỗi</p>
            <p>{error}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        ) : filteredConsultants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy chuyên viên nào</h3>
            <p className="text-gray-500 mb-4">
              {search || date || time || specialty !== 'all'
                ? 'Không có kết quả phù hợp với tiêu chí tìm kiếm của bạn.'
                : 'Hiện tại chưa có thông tin về chuyên viên tư vấn.'}
            </p>
            {(search || date || time || specialty !== 'all') && (
              <button
                onClick={resetFilters}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Xóa bộ lọc và thử lại
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredConsultants.map(consultant => (
              <div key={consultant.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{consultant.fullName}</h3>

                  <div className="space-y-1 mb-4">
                    {consultant.information && (
                      <div className="text-sm text-gray-600 flex items-center">
                        
                        {consultant.information}
                      </div>
                    )}

                    {consultant.address && (
                      <div className="text-sm text-gray-600 flex items-center">
                        {consultant.address}
                      </div>
                    )}

                  
                  </div>

                  <Link
                    to={`/consultantDetail/${consultant.consultantId}`}
                    className="mt-2 inline-block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition shadow-sm hover:shadow-md font-medium"
                  >
                    Xem hồ sơ và đặt lịch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 py-12 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Tại sao nên tư vấn với chuyên gia?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Chuyên môn đáng tin cậy</h3>
                <p className="text-gray-600">
                  Đội ngũ chuyên viên được đào tạo bài bản và có nhiều kinh nghiệm trong lĩnh vực tư vấn về các vấn đề ma túy và nghiện.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Linh hoạt thời gian</h3>
                <p className="text-gray-600">
                  Dễ dàng chọn thời gian tư vấn phù hợp với lịch trình của bạn và đặt lịch hẹn trực tuyến nhanh chóng.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Bảo mật thông tin</h3>
                <p className="text-gray-600">
                  Mọi thông tin chia sẻ trong buổi tư vấn đều được bảo mật tuyệt đối, giúp bạn an tâm chia sẻ mọi vấn đề.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ConsultantList;
