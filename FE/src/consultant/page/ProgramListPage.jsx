import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

// MapEmbed component dùng luôn trong file này cho tiện
function MapEmbed({ location }) {
  if (!location) return null;
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  return (
    <div className="mt-4">
      <iframe
        title="Google Map"
        width="100%"
        height="200"
        frameBorder="0"
        style={{ border: 0, borderRadius: "12px" }}
        src={mapUrl}
        allowFullScreen
      ></iframe>
    </div>
  );
}

// Ảnh đại diện chương trình mặc định
const DEFAULT_IMAGE = "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png";

function ProgramListPage() {
  const [programs, setPrograms] = useState([]);
  const [myPrograms, setMyPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [programToBeUnregistered, setProgramToBeUnregistered] = useState(null);
  const navigate = useNavigate();
  const PROGRAMS_PER_PAGE = 6;

  // Fetch all programs
  
  useEffect(() => {
    const fetchAllPrograms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/programs', {
          headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
        });
        setPrograms(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          navigate('/login');
        }

        setPrograms([]);
        toast.error('Không thể tải danh sách chương trình');
      } finally {
        setLoading(false);
      }
    };
    fetchAllPrograms();
  }, []);

  // Fetch user's registered programs
  useEffect(() => {
    const fetchMyPrograms = async () => {
      setHistoryLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/programs/my-history', {
          headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
        });
        setMyPrograms(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setMyPrograms([]);
        if (error.response?.status === 401) {
          console.error(error);
        }
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchMyPrograms();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);
  console.log(historyLoading);
  // Đăng ký
  const handleRegister = async (programId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/programs/${programId}/register`, null, {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.status === 200) {
        toast.success('Đăng ký chương trình thành công');
        // Cập nhật myPrograms
        const updatedProgram = programs.find(program => program.id === programId);
        if (updatedProgram) setMyPrograms(prev => [...prev, updatedProgram]);
      } else toast.error('Đăng ký chương trình thất bại');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/login');
      } else toast.error('Đã xảy ra lỗi khi đăng ký chương trình');
    }
  };

  // Hủy đăng ký
  const handleUnregister = (programId) => {
    setProgramToBeUnregistered(programId);
    setShowCancelModal(true);
  };
  const confirmUnregister = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/programs/${programToBeUnregistered}/unregister`, {
        headers: { Authorization: `Bearer ${token}`, Accept: '*/*' },
      });
      if (res.status === 200) {
        toast.success('Hủy đăng ký chương trình thành công');
        setMyPrograms(prev => prev.filter(program => program.id !== programToBeUnregistered));
        setShowCancelModal(false);
        setProgramToBeUnregistered(null);
      } else toast.error('Hủy đăng ký chương trình thất bại');
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi hủy đăng ký chương trình');
      console.error(error);
    }
  };

  const isRegistered = (programId) => {
    return myPrograms.some(program => program.id === programId);
  };

  // Filtering
  const getFilteredPrograms = () => {
    let filtered = [...programs];

    const now = new Date();
    filtered = filtered.filter(program => new Date(program.start_date) >= now);
    if (search.trim() !== '') {
      const searchTerm = search.trim().toLowerCase();
      filtered = filtered.filter(program =>
        program.name.toLowerCase().includes(searchTerm)
        || (program.description && program.description.toLowerCase().includes(searchTerm))
        || (program.location && program.location.toLowerCase().includes(searchTerm))
      );
    }
    switch (activeFilter) {
      case 'registered': {
        const myProgramIds = myPrograms.map(program => program.id);
        filtered = filtered.filter(program => myProgramIds.includes(program.id));
        break;
      }
      case 'upcoming': {
        const today = new Date();
        filtered = filtered.filter(program => new Date(program.start_date) > today);
        break;
      }
      case 'ongoing': {
        const now = new Date();
        filtered = filtered.filter(program =>
          new Date(program.start_date) <= now && new Date(program.end_date) >= now
        );
        break;
      }
      default: break;
    }
    return filtered;
  };

  const filteredPrograms = getFilteredPrograms();
  const totalPages = Math.ceil(filteredPrograms.length / PROGRAMS_PER_PAGE);
  const paginatedPrograms = filteredPrograms.slice(
    (currentPage - 1) * PROGRAMS_PER_PAGE,
    currentPage * PROGRAMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />
      {/* Banner */}
      <section className="relative bg-gradient-to-r from-blue-700 to-blue-900 py-14 md:py-20 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
              Chương trình phòng chống<br className="hidden sm:block" /> ma túy
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-xl">
              Tham gia các chương trình nâng cao nhận thức cộng đồng về phòng chống ma túy. Chung tay xây dựng xã hội khỏe mạnh không ma túy!
            </p>
            <a href="#program-list" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-6 py-3 rounded-xl font-bold shadow-lg transition hover:shadow-2xl">
              Khám phá chương trình
            </a>
          </div>
          <div className="md:w-2/5 flex justify-center">
            <img
              src={DEFAULT_IMAGE}
              alt="Chương trình phòng chống ma túy"
              className="w-full max-w-md h-auto object-contain rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-4" id="program-list">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Program List */}
          <div className="w-full md:w-2/3">
            {/* Filter bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Danh sách chương trình</h2>
              <div className="inline-flex items-center flex-wrap border border-gray-200 rounded-full bg-gray-100 p-1.5 shadow-sm w-full sm:w-auto">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'registered', label: 'Đã đăng ký' },
                  { value: 'upcoming', label: 'Sắp diễn ra' },
                  { value: 'ongoing', label: 'Đang diễn ra' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => { setActiveFilter(f.value); setCurrentPage(1); }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${activeFilter === f.value
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm chương trình..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {search && (
                  <button
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Program Cards */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : paginatedPrograms.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy chương trình nào</h3>
                <p className="text-gray-500">
                  {search ? 'Không có kết quả phù hợp với từ khóa tìm kiếm của bạn.' : 'Hiện tại không có chương trình nào trong danh mục này.'}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7">
                {paginatedPrograms.map(program => {
                  const today = new Date();
                  const startDate = new Date(program.start_date);
                  const endDate = new Date(program.end_date);
                  let badgeStatus = '';
                  let badgeColor = '';
                  if (startDate > today) {
                    badgeStatus = "Sắp diễn ra";
                    badgeColor = "bg-purple-100 text-purple-800";
                  } else if (endDate < today) {
                    badgeStatus = "Đã kết thúc";
                    badgeColor = "bg-gray-100 text-gray-800";
                  } else {
                    badgeStatus = "Đang diễn ra";
                    badgeColor = "bg-yellow-100 text-yellow-800";
                  }
                  return (
                    <div key={program.id} className="relative bg-white rounded-2xl shadow-md hover:shadow-xl border border-blue-50 transition group overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 flex items-center justify-center p-4">
                          <img
                            src={program.image || DEFAULT_IMAGE}
                            alt={program.name}
                            className="w-28 h-28 object-cover rounded-xl group-hover:scale-105 transition"
                            onError={e => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
                          />
                        </div>
                        <div className="flex-1 p-6 flex flex-col">
                          <div className="flex gap-2 mb-2">
                            {isRegistered(program.id) ? (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 shadow">
                                Đã đăng ký
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 shadow">
                                Chưa đăng ký
                              </span>
                            )}
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${badgeColor} shadow`}>
                              {badgeStatus}
                            </span>
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-1">{program.name}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">{program.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm mb-3">
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full"><b>Địa điểm:</b>&nbsp;{program.location}</span>
                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full"><b>Bắt đầu:</b>&nbsp;{formatDate(program.start_date)}</span>
                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full"><b>Kết thúc:</b>&nbsp;{formatDate(program.end_date)}</span>
                          </div>
                          <MapEmbed location={program.location} />
                          <div className="flex gap-3 mt-4">
                            {isRegistered(program.id) ? (
                              <button
                                onClick={() => handleUnregister(program.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition shadow"
                              >
                                Hủy đăng ký
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegister(program.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow"
                              >
                                Đăng ký tham gia
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Trang trước</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border ${currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            } text-sm font-medium`}
                        >{pageNum}</button>
                      );
                    } else if (
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >...</span>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Trang sau</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
          {/* Sidebar */}
          <div className="w-full md:w-1/3 space-y-6 mt-10 md:mt-0">
            <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-700 mb-4">Về chương trình phòng chống ma túy</h3>
              <div className="text-gray-700 mb-4">
                Các chương trình được thiết kế để nâng cao nhận thức về tác hại của ma túy và xây dựng cộng đồng khỏe mạnh không ma túy. Khi tham gia, bạn sẽ được:
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tiếp cận thông tin chính xác về ma túy và tác hại</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Tham gia các hoạt động cộng đồng có ý nghĩa</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Giao lưu với những người có cùng mối quan tâm</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Đóng góp vào việc xây dựng cộng đồng an toàn</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-blue-800">Tham gia ngay!</h3>
              </div>
              <div className="text-gray-700 mb-4">
                Hãy đăng ký tham gia các chương trình để góp phần bảo vệ bạn, gia đình và cộng đồng!
              </div>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl text-purple-500">🤝</span>
                <span className="text-gray-700">Tạo mạng lưới kết nối và hỗ trợ cộng đồng phòng chống ma túy.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl text-blue-600">📢</span>
                <span className="text-gray-700">Nâng cao tiếng nói và lan tỏa thông điệp sống khỏe mạnh không ma túy!</span>
              </div>
            </div>
            {/* Statistics */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê chương trình</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{programs.length}</p>
                  <p className="text-gray-600 text-sm">Tổng số chương trình</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{myPrograms.length}</p>
                  <p className="text-gray-600 text-sm">Đã đăng ký</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">
                    {programs.filter(program => {
                      const today = new Date();
                      const startDate = new Date(program.start_date);
                      const endDate = new Date(program.end_date);
                      return today >= startDate && today <= endDate;
                    }).length}
                  </p>
                  <p className="text-gray-600 text-sm">Đang diễn ra</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {programs.filter(program => new Date(program.start_date) > new Date()).length}
                  </p>
                  <p className="text-gray-600 text-sm">Sắp diễn ra</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for unregistering confirmation */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Xác nhận hủy đăng ký</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn hủy đăng ký tham gia chương trình này? Bạn có thể đăng ký lại sau nếu muốn.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmUnregister}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default ProgramListPage;