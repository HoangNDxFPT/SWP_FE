import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { toast } from "react-toastify";


const DEFAULT_IMAGE =
  "https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png";

function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [completedCourses, setCompletedCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseStatuses, setCourseStatuses] = useState({});
 
  

  const navigate = useNavigate();
  const COURSES_PER_PAGE = 6;

  // Lấy thông tin user và các khóa học đã đăng ký
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await api.get("profile");
        if (res.status === 200 && res.data) {
          setUser(res.data);
          if (res.data.userId) {
            // Lấy danh sách khóa học đã đăng ký và trạng thái
            const enrolledRes = await api.get(
              `/enrollments/user/${res.data.userId}`
            );
            if (Array.isArray(enrolledRes.data)) {
              const enrolledIds = [];
              const statuses = {};
              const completed = [];
              enrolledRes.data.forEach((item) => {
                enrolledIds.push(item.courseId);
                statuses[item.courseId] = item.status;
                if (item.status === "Completed") completed.push(item.courseId);
              });
              setEnrolledCourses(enrolledIds);
              setCourseStatuses(statuses);
              setCompletedCourses(completed);
            }
          }
        }
      } catch (err) {
        setUser(null);
        toast.error("Không thể tải thông tin người dùng");
        if (err.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch tất cả khóa học
  useEffect(() => {
    const fetchAllCourses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/courses/list", {
          headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
        });
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        setCourses([]);
        toast.error("Không thể tải danh sách khóa học");
        if (error.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAllCourses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

 

  

  // Nhóm tuổi
  const getUserAgeGroup = () => {
    if (user && user.dateOfBirth) {
      const birth = new Date(user.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age < 18 ? "Teenagers" : "Adults";
    }
    return "";
  };
  const userAgeGroup = getUserAgeGroup();

  // Lọc & phân trang
  const getFilteredCourses = () => {
    let filtered = [...courses];
    if (search.trim() !== "") {
      const searchTerm = search.trim().toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm) ||
          (course.description &&
            course.description.toLowerCase().includes(searchTerm))
      );
    }
    switch (activeFilter) {
      case "recommended":
        if (userAgeGroup)
          filtered = filtered.filter(
            (course) => course.targetAgeGroup === userAgeGroup
          );
        break;
      case "completed":
        filtered = filtered.filter(
          (course) =>
            courseStatuses[course.id] === "Completed" ||
            completedCourses.includes(course.id)
        );
        break;
      case "enrolled":
        filtered = filtered.filter(
          (course) =>
            enrolledCourses.includes(course.id) &&
            courseStatuses[course.id] === "InProgress"
        );
        break;
      case "cancelled":
        filtered = filtered.filter(
          (course) => courseStatuses[course.id] === "Cancelled"
        );
        break;
      default:
        break;
    }
    return filtered;
  };

  const filteredCourses = getFilteredCourses();
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  // Date format
  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("vi-VN", options);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />

      {/* Banner */}
      <section className="relative bg-gradient-to-r from-blue-700 to-blue-900 py-14 md:py-20 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg">
              Khóa học phòng chống
              <br className="hidden sm:block" /> ma túy
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-xl">
              Bộ tài liệu giáo dục tương tác được thiết kế để nâng cao nhận thức
              về ma túy và tác hại của chúng.
            </p>
            <a
              href="#course-list"
              className="inline-block bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-6 py-3 rounded-xl font-bold shadow-lg transition hover:shadow-2xl"
            >
              Khám phá khóa học
            </a>
          </div>
          <div className="md:w-2/5 flex justify-center">
            <img
              src="https://res.cloudinary.com/dwjtg28ti/image/upload/v1751184828/raw_wdvcwx.png"
              alt="Khóa học phòng chống ma túy"
              className="w-full max-w-md h-auto object-contain rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="max-w-6xl mx-auto py-12 px-4" id="course-list">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Course List */}
          <div className="w-full md:w-2/3">
            {/* Filter bar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Danh sách khóa học
              </h2>
              <div className="inline-flex items-center flex-wrap border border-gray-200 rounded-full bg-gray-100 p-1.5 shadow-sm w-full sm:w-auto">
                {[{ value: "all", label: "Tất cả" }].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setActiveFilter(f.value);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors m-0.5 ${
                      activeFilter === f.value
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
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
                  placeholder="Tìm kiếm khóa học..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 absolute left-3 top-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {search && (
                  <button
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearch("")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Course Cards */}
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : paginatedCourses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Không tìm thấy khóa học nào
                </h3>
                <p className="text-gray-500">
                  {search
                    ? "Không có kết quả phù hợp với từ khóa tìm kiếm của bạn."
                    : "Hiện tại không có khóa học nào trong danh mục này."}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-7">
                {paginatedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="relative bg-white rounded-2xl shadow-md hover:shadow-xl border border-blue-50 transition group overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-center justify-center p-4">
                        <img
                          src={course.url || DEFAULT_IMAGE}
                          alt={course.name}
                          className="w-28 h-28 object-cover rounded-xl group-hover:scale-105 transition"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_IMAGE;
                          }}
                        />
                      </div>
                      <div className="flex-1 p-6 flex flex-col">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {course.targetAgeGroup === "Teenagers"
                              ? "Thanh thiếu niên"
                              : "Người trưởng thành"}
                          </span>
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Bắt đầu: {formatDate(course.startDate)}
                          </span>
                          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Kết thúc: {formatDate(course.endDate)}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-blue-700 mb-2">
                          {course.name}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {course.description || "..."}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-auto">
                          <Link
                            to={`/consultant/course/${course.id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center"
                          >
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12H9m12 0A9 9 0 11-3 0a9 9 0 0118 0z"
                              />
                            </svg>
                            Xem nội dung
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
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
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          } text-sm font-medium`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 &&
                        currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
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
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
          {/* Sidebar */}
          <div className="w-full md:w-1/3 space-y-6 mt-10 md:mt-0">
            {/* About Courses Box */}
            <div className="bg-white rounded-2xl shadow-md p-6 border-t-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-700 mb-4">
                Về khóa học phòng chống ma túy
              </h3>
              <div className="text-gray-700 mb-4">
                Các khóa học được thiết kế bởi chuyên gia để nâng cao nhận thức
                về ma túy và cách phòng tránh. Khi tham gia, bạn sẽ được:
              </div>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Kiến thức chính xác và cập nhật về các loại ma túy
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Kỹ năng nhận biết và từ chối ma túy hiệu quả</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Bài học tương tác và kiểm tra kiến thức</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Chứng nhận hoàn thành khóa học</span>
                </li>
              </ul>
            </div>
            {/* Start Learning Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full mr-3">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-blue-800">
                  Bắt đầu học ngay!
                </h3>
              </div>
              <div className="text-gray-700 mb-4">
                Hãy tham gia các khóa học để trang bị kiến thức và kỹ năng cần
                thiết trong việc phòng chống ma túy và bảo vệ bản thân!
              </div>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl text-purple-500">📚</span>
                <span className="text-gray-700">
                  Học mọi lúc, mọi nơi với nội dung được thiết kế phù hợp với độ
                  tuổi.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl text-blue-600">🏆</span>
                <span className="text-gray-700">
                  Nhận chứng nhận hoàn thành và chia sẻ kiến thức với bạn bè,
                  gia đình.
                </span>
              </div>
            </div>
            {/* Statistics */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Thống kê khóa học
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {courses.length}
                  </p>
                  <p className="text-gray-600 text-sm">Tổng số khóa học</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {
                      enrolledCourses.filter(
                        (id) => courseStatuses[id] === "InProgress"
                      ).length
                    }
                  </p>
                  <p className="text-gray-600 text-sm">Đang học</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-700">
                    {completedCourses.length}
                  </p>
                  <p className="text-gray-600 text-sm">Đã hoàn thành</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">
                    {userAgeGroup
                      ? courses.filter(
                          (course) => course.targetAgeGroup === userAgeGroup
                        ).length
                      : 0}
                  </p>
                  <p className="text-gray-600 text-sm">Phù hợp với bạn</p>
                </div>
              </div>
            </div>
            {/* FAQs */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Câu hỏi thường gặp
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">
                    Các khóa học có tính phí không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Không, tất cả khóa học đều miễn phí và được phát triển nhằm
                    mục đích giáo dục cộng đồng.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">
                    Tôi có thể học trong bao lâu?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Bạn có thể học theo tốc độ của riêng mình, không có giới hạn
                    thời gian.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">
                    Làm thế nào để nhận chứng nhận?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Hoàn thành tất cả bài học và bài kiểm tra trong khóa học để
                    nhận chứng nhận.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-700 mb-1">
                    Tôi có thể đăng ký nhiều khóa học không?
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Có, bạn có thể đăng ký và học nhiều khóa học cùng lúc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      <Footer />
    </div>
  );
}

export default CoursesListPage;
