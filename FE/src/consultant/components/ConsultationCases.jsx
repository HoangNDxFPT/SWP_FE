import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { Bar, Pie } from "react-chartjs-2";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Tag, Spin, Modal, Button, Select } from "antd";

const consultantId = JSON.parse(
  localStorage.getItem("user") || "{}"
).consultantId;

export default function ConsultationCases() {
  const [assessments, setAssessments] = useState([]); // Chứa các bài khảo sát cá nhân (ASSIST, CRAFFT) đã hoàn thành
  const [users, setUsers] = useState([]); // Chứa danh sách người dùng duy nhất từ các bài khảo sát
  const [selectedUser, setSelectedUser] = useState(null); // ID của người dùng đang được chọn
  const [userResults, setUserResults] = useState([]); // Kết quả đánh giá của người dùng được chọn (ASSIST/CRAFFT)
  const [loading, setLoading] = useState(false); // Trạng thái tải chung
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailResult, setDetailResult] = useState(null);

  // Bộ lọc cho kết quả của một người dùng (ASSIST/CRAFFT)
  const [filterType, setFilterType] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Thêm state cho chương trình và mẫu khảo sát
  const [userPrograms, setUserPrograms] = useState([]);

  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [enrollments, setEnrollments] = useState([]); // Tất cả các đăng ký
  const [courses, setCourses] = useState([]); // Khóa học
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizResults, setQuizResults] = useState([]);
  const [selectedQuizEnrollment, setSelectedQuizEnrollment] = useState(null);
  const [selectedQuizResult, setSelectedQuizResult] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});

  useEffect(() => {
    if (!selectedUser) {
      setEnrollments([]);
      return;
    }
    const fetchEnrollments = async () => {
      try {
        const resEnroll = await api.get("/enrollments/all-enrollments");
        // Lọc đăng ký của user này
        setEnrollments(
          resEnroll.data.filter(
            (e) => String(e.userId) === String(selectedUser)
          )
        );
        const resCourses = await api.get("/courses/list");
        setCourses(resCourses.data || []);
      } catch (e) {
        setEnrollments([]);
        setCourses([]);
        console.error("Error fetching enrollments:", e);
      }
    };
    fetchEnrollments();
  }, [selectedUser]);

  const handleViewQuiz = async (enrollment) => {
    setQuizLoading(true);
    setShowQuizModal(true);
    setSelectedQuizEnrollment(enrollment);
    setQuizResults([]);
    setSelectedQuizResult(null);
    setQuizQuestions([]);
    setUserAnswers({});
    try {
      // Lấy kết quả quiz của user cho khóa học này
      const resQuiz = await api.get("/quiz-result");
      const results = resQuiz.data.filter(
        (r) =>
          r.user &&
          String(r.user.id) === String(enrollment.userId) &&
          r.course &&
          String(r.course.id) === String(enrollment.courseId)
      );
      setQuizResults(results);
      if (results.length) {
        setSelectedQuizResult(results[0]);
        // Lấy câu hỏi quiz
        const resQuizQ = await api.get(`/quiz/course/${enrollment.courseId}`);
        setQuizQuestions(resQuizQ.data);
        // Lấy đáp án user
        const resAnswers = await api.get(`/quiz/result/${results[0].id}`);
        const answersMap = {};
        resAnswers.data.forEach((ans) => {
          answersMap[ans.questionId] = ans.selectedAnswer;
        });
        setUserAnswers(answersMap);
      }
    } catch (e) {
      console.error("Error fetching quiz data:", e);
    }
    setQuizLoading(false);
  };

  // Lấy tất cả bài khảo sát đã hoàn thành và danh sách người dùng duy nhất
  // Đồng thời lấy toàn bộ templates (mẫu khảo sát) một lần duy nhất khi component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Lấy tất cả assessments
        const resAssessments = await api.get("/assessments/all");
        const completedAssessments = (resAssessments.data || []).filter(
          (a) => a.submitted
        );

        // Lọc chỉ các bài test cá nhân (ASSIST, CRAFFT) để hiển thị trong bảng tổng quan
        const personalAssessments = completedAssessments.filter(
          (a) =>
            a.type === "ASSIST" ||
            a.type === "CRAFFT" ||
            a.assessmentType === "ASSIST" ||
            a.assessmentType === "CRAFFT"
        );
        setAssessments(personalAssessments); // Cập nhật state với chỉ các bài test cá nhân

        const uniqueUsers = [];
        const userMap = {};
        // Duyệt qua TẤT CẢ completedAssessments (không chỉ personalAssessments) để lấy danh sách người dùng duy nhất
        // Điều này đảm bảo rằng dropdown chọn người dùng vẫn có đủ tất cả người dùng đã hoàn thành bài test
        completedAssessments.forEach((a) => {
          if (a.member && !userMap[a.member.id]) {
            userMap[a.member.id] = true;
            uniqueUsers.push(a.member);
          }
        });
        setUsers(uniqueUsers);

        // Lấy toàn bộ templates
      } catch (e) {
        setAssessments([]);

        console.error("Error fetching initial data:", e);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // Khi chọn user: lấy kết quả khảo sát (ASSIST/CRAFFT) và lịch sử chương trình
  useEffect(() => {
    if (!selectedUser) {
      setUserResults([]);
      setUserPrograms([]);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true); // Bật loading chung khi fetching user-specific data

      // Fetch user assessment results
      try {
        const res = await api.get(`/assessment-results/user/${selectedUser}`);
        setUserResults(res.data || []);
      } catch (e) {
        setUserResults([]);
        console.error("Error fetching user assessment results:", e);
      }

      // Fetch user programs history
      setLoadingPrograms(true);
      try {
        const res = await api.get(`/programs/history-user/${selectedUser}`);
        console.log("Gọi API lịch sử chương trình với userId", selectedUser);
        setUserPrograms(res.data || []);
      } catch (e) {
        setUserPrograms([]);
        console.error("Error fetching user programs:", e);
      } finally {
        setLoadingPrograms(false);
      }

      setLoading(false); // Tắt loading chung sau khi tất cả data đã được fetch
    };
    fetchUserData();
  }, [selectedUser]);

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return format(parseISO(date), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch {
      return date;
    }
  };

  // Hàm format ngày chỉ với dd/MM/yyyy (dùng cho chương trình)
  const formatShortDate = (date) => {
    if (!date) return "";
    try {
      return format(parseISO(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return date;
    }
  };

  // Lọc kết quả theo bộ lọc (áp dụng cho userResults)
  const filterResults = () => {
    let filtered = [...userResults];
    if (filterType)
      filtered = filtered.filter((r) => r.assessmentType === filterType);
    if (filterRiskLevel)
      filtered = filtered.filter((r) => r.riskLevel === filterRiskLevel);
    if (filterDateFrom)
      filtered = filtered.filter(
        (r) =>
          new Date(r.submittedAt).toISOString().split("T")[0] >= filterDateFrom
      );
    if (filterDateTo)
      filtered = filtered.filter(
        (r) =>
          new Date(r.submittedAt).toISOString().split("T")[0] <= filterDateTo
      );
    return filtered;
  };
  const filteredResults = filterResults();

  const resetFilters = () => {
    setFilterType("");
    setFilterRiskLevel("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 text-blue-900">
        Hồ sơ tư vấn khách hàng
      </h1>

      {/* Thanh chọn user */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="h-8 w-1 bg-blue-500 rounded mr-3"></div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">
            Chọn khách hàng để xem kết quả
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Select
            showSearch
            className="w-full"
            value={selectedUser || undefined}
            onChange={(value) => setSelectedUser(value)}
            placeholder="-- Chọn khách hàng --"
            optionFilterProp="label"
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            loading={loading}
            allowClear
            options={users.map((u) => ({
              value: u.id,
              label: `${u.fullName} (${u.email})`,
            }))}
          />
          {/* Nút xóa user đang chọn */}
          {selectedUser && (
            <button
              className="ml-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-700 font-bold"
              onClick={() => {
                setSelectedUser(null);
                resetFilters();
              }} // Reset filters when clearing user
              title="Bỏ chọn người dùng"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị chi tiết khi đã chọn user */}
      {selectedUser && (
        <>
          {/* Bộ lọc cho kết quả ASSIST/CRAFFT */}
          <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Loại đánh giá
                </label>
                <select
                  className="w-full border rounded-lg p-2.5"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="ASSIST">ASSIST</option>
                  <option value="CRAFFT">CRAFFT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Mức độ rủi ro
                </label>
                <select
                  className="w-full border rounded-lg p-2.5"
                  value={filterRiskLevel}
                  onChange={(e) => setFilterRiskLevel(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="LOW">Thấp</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HIGH">Cao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Từ ngày
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2.5"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-gray-700">
                  Đến ngày
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-2.5"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  min={filterDateFrom}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Chart + Table kết quả ASSIST/CRAFFT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-8 w-1 bg-green-500 rounded mr-3"></div>
                <h3 className="font-semibold text-gray-800">
                  Phân bố mức độ rủi ro (ASSIST/CRAFFT)
                </h3>
              </div>
              <div className="h-64">
                <Pie
                  data={{
                    labels: ["Thấp", "Trung bình", "Cao"],
                    datasets: [
                      {
                        data: [
                          filteredResults.filter((r) => r.riskLevel === "LOW")
                            .length,
                          filteredResults.filter(
                            (r) => r.riskLevel === "MEDIUM"
                          ).length,
                          filteredResults.filter((r) => r.riskLevel === "HIGH")
                            .length,
                        ],
                        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
                      },
                    ],
                  }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-8 w-1 bg-blue-500 rounded mr-3"></div>
                <h3 className="font-semibold text-gray-800">
                  Số lượng bài theo loại (ASSIST/CRAFFT)
                </h3>
              </div>
              <div className="h-64">
                <Bar
                  data={{
                    labels: ["ASSIST", "CRAFFT"],
                    datasets: [
                      {
                        label: "Số lượng",
                        data: [
                          filteredResults.filter(
                            (r) => r.assessmentType === "ASSIST"
                          ).length,
                          filteredResults.filter(
                            (r) => r.assessmentType === "CRAFFT"
                          ).length,
                        ],
                        backgroundColor: ["#3B82F6", "#8B5CF6"],
                      },
                    ],
                  }}
                  options={{
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bảng kết quả ASSIST/CRAFFT của user */}
          <div className="overflow-x-auto mb-8">
            <div className="flex items-center mb-4">
              <div className="h-8 w-1 bg-purple-500 rounded mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                Kết quả đánh giá ASSIST/CRAFFT
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Điểm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Rủi ro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Khuyến nghị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Ngày nộp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      Không có bài đánh giá nào theo tiêu chí lọc
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr
                      key={r.assessmentResultId}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4">{r.assessmentResultId}</td>
                      <td className="px-6 py-4">{r.assessmentType}</td>
                      <td className="px-6 py-4">{r.score}</td>
                      <td className="px-6 py-4">
                        <Tag
                          color={
                            r.riskLevel === "LOW"
                              ? "green"
                              : r.riskLevel === "MEDIUM"
                              ? "orange"
                              : "red"
                          }
                        >
                          {r.riskLevel}
                        </Tag>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate">
                        {r.recommendation}
                      </td>
                      <td className="px-6 py-4">{formatDate(r.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            setDetailResult(r);
                            setShowDetailModal(true);
                          }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bảng Chương trình khách hàng đã tham gia */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="h-8 w-1 bg-orange-500 rounded mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                Chương trình khách hàng đã tham gia
              </h2>
            </div>
            {loadingPrograms ? (
              <div className="flex justify-center items-center h-40">
                <Spin tip="Đang tải chương trình..." />
              </div>
            ) : userPrograms.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                Chưa có chương trình nào khách hàng này đã tham gia.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        Tên chương trình
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        Thời gian
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        Địa điểm
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {userPrograms.map((program) => (
                      <tr
                        key={program.id}
                        className="hover:bg-orange-50 transition-colors"
                      >
                        <td className="px-4 py-2 font-medium">
                          {program.name}
                        </td>
                        <td className="px-4 py-2">
                          {formatShortDate(program.start_date)} -{" "}
                          {formatShortDate(program.end_date)}
                        </td>
                        <td className="px-4 py-2">{program.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Bảng kết quả Quiz */}
          {/* Bảng các khóa học đã tham gia và quiz */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="h-8 w-1 bg-blue-500 rounded mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">
                Khóa học đã tham gia & Quiz
              </h2>
            </div>
            {enrollments.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                Khách hàng chưa đăng ký khóa học nào.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold">
                        Tên khóa học
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold">
                        Ngày đăng ký
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold">
                        Trạng thái
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold">
                        Quiz
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const course = courses.find(
                        (c) => String(c.id) === String(enrollment.courseId)
                      );
                      return (
                        <tr
                          key={enrollment.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-2">
                            {course?.name || course?.title || "N/A"}
                          </td>
                          <td className="px-4 py-2">
                            {formatShortDate(enrollment.enrolledAt)}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={
                                enrollment.status === "Completed"
                                  ? "text-green-700"
                                  : enrollment.status === "InProgress"
                                  ? "text-yellow-700"
                                  : "text-red-700"
                              }
                            >
                              {enrollment.status === "Completed"
                                ? "Đã hoàn thành"
                                : enrollment.status === "InProgress"
                                ? "Đang học"
                                : "Đã hủy"}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <button
                              className="text-blue-600 hover:underline"
                              onClick={() => handleViewQuiz(enrollment)}
                            >
                              Xem quiz
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        title={<span className="text-xl font-bold">Kết quả Quiz</span>}
        open={showQuizModal}
        onCancel={() => setShowQuizModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowQuizModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        centered
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {quizLoading ? (
          <Spin size="large" tip="Đang tải kết quả quiz..." />
        ) : selectedQuizResult ? (
          <div>
            {/* Thông tin khóa học và người dùng */}
            <div className="mb-4">
              <b>Khóa học:</b>{" "}
              {courses.find(
                (c) => String(c.id) === String(selectedQuizEnrollment?.courseId)
              )?.name || "N/A"}
              <br />
              <b>Ngày đăng ký:</b>{" "}
              {formatShortDate(selectedQuizEnrollment?.enrolledAt)}
            </div>

            {/* Nếu có nhiều lần làm quiz */}
            {quizResults.length > 1 && (
              <div className="mb-4">
                <b>Chọn lần làm bài:</b>
                <div className="flex gap-2 mt-2">
                  {quizResults.map((result, idx) => (
                    <Button
                      key={result.id}
                      type={
                        selectedQuizResult.id === result.id
                          ? "primary"
                          : "default"
                      }
                      onClick={() => {
                        setSelectedQuizResult(result);
                        // Lấy lại đáp án user cho lần này
                        api.get(`/quiz/result/${result.id}`).then((res) => {
                          const answersMap = {};
                          res.data.forEach((ans) => {
                            answersMap[ans.questionId] = ans.selectedAnswer;
                          });
                          setUserAnswers(answersMap);
                        });
                      }}
                    >
                      Lần {idx + 1} (
                      {new Date(result.submittedAt).toLocaleDateString("vi-VN")}
                      )
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Tóm tắt kết quả */}
            <div
              className={`mb-4 p-4 rounded ${
                selectedQuizResult.score / selectedQuizResult.totalQuestions >=
                0.8
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <div className="text-lg font-bold mb-2">
                {selectedQuizResult.score}/{selectedQuizResult.totalQuestions}{" "}
                đúng (
                {Math.round(
                  (selectedQuizResult.score /
                    selectedQuizResult.totalQuestions) *
                    100
                )}
                %) -
                <span
                  className={
                    selectedQuizResult.score /
                      selectedQuizResult.totalQuestions >=
                    0.8
                      ? "text-green-600 ml-2"
                      : "text-red-600 ml-2"
                  }
                >
                  {selectedQuizResult.score /
                    selectedQuizResult.totalQuestions >=
                  0.8
                    ? "Đậu"
                    : "Rớt"}
                </span>
              </div>
              <div className="text-gray-600 text-sm">
                Ngày làm bài:{" "}
                {new Date(selectedQuizResult.submittedAt).toLocaleString(
                  "vi-VN"
                )}
              </div>
            </div>

            {/* Danh sách câu hỏi/đáp án */}
            <div>
              <b>Chi tiết từng câu hỏi:</b>
              <div className="mt-3 space-y-4">
                {quizQuestions.map((question, idx) => {
                  const userAnswerIndex = userAnswers[question.id];
                  const isCorrect = userAnswerIndex === question.correct;
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="mb-2 font-medium">
                        {idx + 1}. {question.question}
                      </div>
                      <div className="ml-4">
                        {question.answer.map((ans, aIdx) => (
                          <div
                            key={aIdx}
                            className={`py-1 px-2 rounded mb-1
                        ${aIdx === question.correct ? "bg-green-100" : ""}
                        ${
                          userAnswerIndex === aIdx && aIdx !== question.correct
                            ? "bg-red-100"
                            : ""
                        }
                      `}
                          >
                            <span className="font-bold">
                              {String.fromCharCode(65 + aIdx)}.{" "}
                            </span>
                            {ans}
                            {aIdx === question.correct && (
                              <span className="text-green-600 ml-2">
                                (Đáp án đúng)
                              </span>
                            )}
                            {userAnswerIndex === aIdx &&
                              aIdx !== question.correct && (
                                <span className="text-red-600 ml-2">
                                  (Đáp án của bạn)
                                </span>
                              )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-1 text-xs">
                        {isCorrect ? (
                          <span className="text-green-600">
                            Bạn trả lời đúng
                          </span>
                        ) : userAnswerIndex !== undefined ? (
                          <span className="text-red-600">Bạn trả lời sai</span>
                        ) : (
                          <span className="text-gray-400">
                            Bạn chưa chọn đáp án
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <span>Chưa có kết quả quiz cho khóa học này.</span>
          </div>
        )}
      </Modal>

      {/* Modal chi tiết kết quả ASSIST/CRAFFT */}
      <Modal
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        title="Chi tiết kết quả đánh giá"
        footer={null}
        width={700}
      >
        {detailResult && (
          <div>
            <div className="mb-3">
              <b>Loại bài test: </b>
              {detailResult.assessmentType}
            </div>
            <div className="mb-3">
              <b>Điểm số: </b>
              <span className="text-blue-700 font-bold">
                {detailResult.score}
              </span>
            </div>
            <div className="mb-3">
              <b>Mức rủi ro: </b>
              <Tag
                color={
                  detailResult.riskLevel === "LOW"
                    ? "green"
                    : detailResult.riskLevel === "MEDIUM"
                    ? "orange"
                    : "red"
                }
              >
                {detailResult.riskLevel}
              </Tag>
            </div>
            <div className="mb-3">
              <b>Khuyến nghị: </b>
              <span>{detailResult.recommendation}</span>
            </div>
            <div className="mb-3">
              <b>Ngày nộp: </b>
              <span>{formatDate(detailResult.submittedAt)}</span>
            </div>
            <div>
              <b>Câu trả lời chi tiết:</b>
              <ul className="list-disc ml-5 mt-2">
                {detailResult.answers?.map((a, idx) => (
                  <li key={idx}>
                    <b>{a.questionText}</b>: {a.answerText} (Điểm: {a.score})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title={<span className="text-xl font-bold">Kết quả Quiz</span>}
        open={showQuizModal}
        onCancel={() => setShowQuizModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowQuizModal(false)}>
            Đóng
          </Button>,
        ]}
        width={800}
        centered
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {quizLoading ? (
          <Spin size="large" tip="Đang tải kết quả quiz..." />
        ) : selectedQuizResult ? (
          <div>
            {/* ... nội dung modal quiz như trong UserCourseQuizViewer ... */}
            {/* Xem lại code UserCourseQuizViewer để copy block modal quiz vào đây */}
          </div>
        ) : (
          <div className="text-center py-12">
            <span>Chưa có kết quả quiz cho khóa học này.</span>
          </div>
        )}
      </Modal>

      {/* Spin loader chung */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      )}
    </div>
  );
}
