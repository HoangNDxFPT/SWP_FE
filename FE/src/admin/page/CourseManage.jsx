import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CourseManage() {
  const [courses, setCourses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    targetAgeGroup: "",
    type: "",
    url: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Trạng thái mới cho quản lý bài học và quiz
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState({
    title: "",
    content: "",
    materialUrl: "",
    lessonOrder: 0,
    courseId: null
  });
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState({
    title: "",
    questions: [],
    courseId: null
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    content: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ]
  });
  // Thêm state để theo dõi câu hỏi đang chỉnh sửa
  const [editQuestionIndex, setEditQuestionIndex] = useState(null);

  // Lấy danh sách khóa học, backend đã lọc những khóa học đã xóa
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses/list");
      setCourses(res.data || []);
    } catch (err) {
      toast.error("Failed to load courses!");
      if (err.response) {
        console.error("Backend error:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Kiểm tra định dạng ngày tháng
  const isValidDateFormat = (dateString) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  };

  // Tạo khóa học mới
  const handleCreate = async () => {
    if (!newCourse.name || !newCourse.startDate || !newCourse.endDate) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (!isValidDateFormat(newCourse.startDate) || !isValidDateFormat(newCourse.endDate)) {
      toast.error("Invalid date format");
      return;
    }
    const payload = { ...newCourse };
    try {
      setLoading(true);
      await api.post("/courses", payload);
      toast.success("Course created successfully!");
      setShowCreate(false);
      setNewCourse({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        targetAgeGroup: "",
        type: "",
        url: ""
      });
      fetchCourses();
    } catch (err) {
      toast.error("Failed to create course!");
      if (err.response) {
        console.error("Backend error:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa khóa học
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        setLoading(true);
        await api.delete(`/courses/${id}`);
        toast.success("Delete course successfully!");
        fetchCourses();
      } catch (err) {
        toast.error("Delete failed!");
        if (err.response) {
          console.error("Delete error:", err.response.data);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Lưu chỉnh sửa khóa học
  const handleSave = async () => {
    if (!editCourse.name || !editCourse.startDate || !editCourse.endDate) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (!isValidDateFormat(editCourse.startDate) || !isValidDateFormat(editCourse.endDate)) {
      toast.error("Invalid date format");
      return;
    }
    const payload = { ...editCourse };
    try {
      setLoading(true);
      await api.put(`/courses/${editCourse.id}`, payload);
      toast.success("Course updated successfully!");
      setEditMode(false);
      setEditCourse(null);
      fetchCourses();
    } catch (err) {
      toast.error("Failed to update course!");
      if (err.response) {
        console.error("Update error:", err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách bài học theo khóa học
  const fetchLessons = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.get(`/lessons/course/${courseId}`);
      setLessons(res.data || []);
    } catch (error) {
      toast.error("Failed to load lessons");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách quiz theo khóa học
  const fetchQuizzes = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.get(`/quiz/course/${courseId}`);
      const quizData = res.data || [];

      // Tạo một tập hợp các câu hỏi cho khóa học này
      const questions = quizData.map(item => {
        // Parse answer từ string JSON
        let options = [];
        try {
          options = JSON.parse(item.answer);
          // Nếu parse không phải array thì đặt nó vào array
          if (!Array.isArray(options)) options = [item.answer];
        } catch (e) {
          // Nếu không phải JSON, coi như là một đáp án đơn lẻ
          options = [item.answer];
        }

        return {
          id: item.id,
          content: item.question,
          options: options.map((opt, idx) => ({
            text: opt,
            isCorrect: idx + 1 === item.correct
          }))
        };
      });

      // Tạo quiz từ tập hợp câu hỏi
      const formattedQuizzes = [{
        id: courseId,
        courseId: courseId,
        title: `Quiz for Course ${courseId}`,
        questions: questions
      }];

      setQuizzes(formattedQuizzes);
    } catch (error) {
      toast.error("Failed to load quizzes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Thêm hoặc cập nhật bài học
  const handleSaveLesson = async () => {
    // Kiểm tra courseId hoặc course.id
    const courseIdToUse = currentLesson.courseId || currentLesson.course?.id;

    if (!currentLesson.title || !courseIdToUse) {
      toast.error("Please enter lesson title");
      return;
    }

    try {
      setLoading(true);

      // Tạo payload theo đúng schema API
      const lessonPayload = {
        title: currentLesson.title,
        content: currentLesson.content || "",
        materialUrl: currentLesson.materialUrl || "",
        lessonOrder: currentLesson.lessonOrder || 0,
        course: {
          id: courseIdToUse
        }
      };

      // Thêm id nếu đang cập nhật bài học
      if (currentLesson.id) {
        lessonPayload.id = currentLesson.id;
      }

      if (currentLesson.id) {
        // Cập nhật bài học hiện có
        await api.put(`/lessons/${currentLesson.id}`, lessonPayload);
        toast.success("Lesson updated successfully");
      } else {
        // Thêm bài học mới
        await api.post("/lessons", lessonPayload);
        toast.success("Lesson added successfully");
      }
      fetchLessons(currentLesson.courseId);
      setShowLessonModal(false);
    } catch (error) {
      toast.error(currentLesson.id ? "Failed to update lesson" : "Failed to add lesson");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Xóa bài học
  const handleDeleteLesson = async (id) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      try {
        setLoading(true);
        await api.delete(`/lessons/${id}`);
        toast.success("Lesson deleted successfully");
        fetchLessons(selectedCourse.id);
      } catch (error) {
        toast.error("Failed to delete lesson");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Thêm hoặc cập nhật quiz
  const handleSaveQuiz = async () => {
    if (!currentQuiz.courseId || currentQuiz.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    try {
      setLoading(true);

      // Title mặc định nếu không có
      const quizTitle = currentQuiz.title || `Quiz for Course ${currentQuiz.courseId}`;

      // Chuyển đổi định dạng dữ liệu thành định dạng API yêu cầu
      const quizQuestions = currentQuiz.questions.map((q, index) => {
        // Tìm đáp án đúng
        const correctOptionIndex = q.options.findIndex(opt => opt.isCorrect);

        return {
          courseId: currentQuiz.courseId,
          question: q.content,
          // Lưu tất cả các đáp án dưới dạng string JSON
          answer: JSON.stringify(q.options.map(opt => opt.text)),
          // Lấy vị trí (1-based) của đáp án đúng
          correct: correctOptionIndex + 1,
          // Giữ id nếu có
          ...(q.id ? { id: q.id } : {})
        };
      });

      // Xử lý từng câu hỏi quiz
      for (const question of quizQuestions) {
        if (question.id) {  // Kiểm tra ID của câu hỏi, không phải ID của quiz
          // Cập nhật câu hỏi hiện có
          await api.put(`/quiz/${question.id}`, question);
        } else {
          // Thêm câu hỏi mới
          await api.post("/quiz", question);
        }
      }

      toast.success(currentQuiz.id ? "Quiz updated successfully" : "Quiz added successfully");
      fetchQuizzes(currentQuiz.courseId);
      setShowQuizModal(false);
    } catch (error) {
      toast.error(currentQuiz.id ? "Failed to update quiz" : "Failed to add quiz");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Xóa quiz
  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        setLoading(true);
        await api.delete(`/quiz/${id}`); // API này đã đúng, xóa câu hỏi theo ID
        toast.success("Question deleted successfully");
        fetchQuizzes(selectedCourse.id); // Tải lại danh sách quiz sau khi xóa
      } catch (error) {
        toast.error("Failed to delete question");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Thêm câu hỏi vào quiz
  const handleAddQuestion = () => {
    // Kiểm tra xem có ít nhất một câu trả lời đúng không
    if (!currentQuestion.options.some(option => option.isCorrect)) {
      toast.error("Please mark at least one correct answer");
      return;
    }

    const updatedQuestions = [...currentQuiz.questions];
    
    if (editQuestionIndex !== null) {
      // Cập nhật câu hỏi đã tồn tại
      updatedQuestions[editQuestionIndex] = currentQuestion;
    } else {
      // Thêm câu hỏi mới
      updatedQuestions.push(currentQuestion);
    }

    setCurrentQuiz({...currentQuiz, questions: updatedQuestions});
    setShowQuestionModal(false);
    setEditQuestionIndex(null);
    
    // Reset form
    setCurrentQuestion({
      content: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ]
    });
  };

  // Chỉnh sửa câu hỏi
  const handleEditQuestion = (index) => {
    setCurrentQuestion({...currentQuiz.questions[index]});
    setEditQuestionIndex(index);
    setShowQuestionModal(true);
  };

  // Lọc khóa học theo tìm kiếm
  const filteredCourses = courses.filter(
    (c) =>
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.targetAgeGroup && c.targetAgeGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Enum đúng cho các trường select
  const AGE_GROUPS = [
    { value: "", label: "Select Age Group" },
    { value: "Teenagers", label: "Teenagers" },
    { value: "Adults", label: "Adults" }
  ];

  const COURSE_TYPES = [
    { value: "", label: "Select Type" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "ONLINE", label: "Online" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "COMMUNITY", label: "Community" }
  ];

  // Function để xử lý thay đổi các tùy chọn đáp án (text và trạng thái đúng/sai)
  const handleOptionChange = (optionIndex, field, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };
    
    // Nếu đang thay đổi trạng thái đúng/sai và chọn đáp án đúng mới
    if (field === 'isCorrect' && value === true) {
      // Reset tất cả các đáp án khác thành sai (nếu muốn chỉ có một đáp án đúng)
      // Bỏ comment dòng dưới nếu bạn muốn chỉ có một đáp án đúng
      // updatedOptions.forEach((opt, idx) => {
      //   if (idx !== optionIndex) opt.isCorrect = false;
      // });
    }
    
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  return (
    <div className="container mx-auto px-4">
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Course Management</h1>

      {/* Search, Filter and Add Bar */}
      <div className="flex flex-wrap justify-between gap-4 mb-6 items-center">
        <div className="flex items-center flex-wrap gap-2">
          {/* Search input */}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search by name, type or age group"
              className="border rounded-l px-3 py-2 w-80 focus:outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Nút xóa tìm kiếm */}
          {searchTerm && (
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded flex items-center"
              onClick={() => setSearchTerm("")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Add Course button */}
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => setShowCreate(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Course
        </button>
      </div>

      {/* Filter info */}
      <p className="text-sm text-gray-500 mb-2">
        Showing {filteredCourses.length} of {courses.length} courses
        {searchTerm && ` matching "${searchTerm}"`}
      </p>

      {/* Courses Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Target Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && !selectedCourse ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No courses found
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">{course.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.description && course.description.length > 30
                      ? `${course.description.substring(0, 30)}...`
                      : course.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.targetAgeGroup === "Teenagers" ? "bg-blue-100 text-blue-800" :
                      course.targetAgeGroup === "Adults" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                      {course.targetAgeGroup || "Unspecified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.type === "WORKSHOP" ? "bg-purple-100 text-purple-800" :
                      course.type === "ONLINE" ? "bg-blue-100 text-blue-800" :
                        course.type === "SEMINAR" ? "bg-yellow-100 text-yellow-800" :
                          course.type === "COMMUNITY" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                      }`}>
                      {course.type || "Unspecified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.url ? (
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setEditMode(true);
                          setEditCourse({ ...course });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => {
                          setSelectedCourse(course);
                          setActiveTab('lessons');
                          fetchLessons(course.id);
                        }}
                      >
                        Manage Content
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                        onClick={() => handleDelete(course.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create course modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Course</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreate(false)}
              >
                ✕
              </button>
            </div>
            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={newCourse.name}
                  onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows="3"
                  value={newCourse.description}
                  onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newCourse.startDate}
                    onChange={e => setNewCourse({ ...newCourse, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newCourse.endDate}
                    onChange={e => setNewCourse({ ...newCourse, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Age Group</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newCourse.targetAgeGroup}
                    onChange={e => setNewCourse({ ...newCourse, targetAgeGroup: e.target.value })}
                  >
                    {AGE_GROUPS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Type</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={newCourse.type}
                    onChange={e => setNewCourse({ ...newCourse, type: e.target.value })}
                  >
                    {COURSE_TYPES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="https://example.com"
                  value={newCourse.url}
                  onChange={e => setNewCourse({ ...newCourse, url: e.target.value })}
                />
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit course modal */}
      {editMode && editCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Course</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setEditMode(false);
                  setEditCourse(null);
                }}
              >
                ✕
              </button>
            </div>
            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={editCourse.name}
                  onChange={e => setEditCourse({ ...editCourse, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows="3"
                  value={editCourse.description}
                  onChange={e => setEditCourse({ ...editCourse, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={editCourse.startDate}
                    onChange={e => setEditCourse({ ...editCourse, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={editCourse.endDate}
                    onChange={e => setEditCourse({ ...editCourse, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Age Group</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={editCourse.targetAgeGroup}
                    onChange={e => setEditCourse({ ...editCourse, targetAgeGroup: e.target.value })}
                  >
                    {AGE_GROUPS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Course Type</label>
                  <select
                    className="mt-1 block w-full border rounded px-3 py-2"
                    value={editCourse.type}
                    onChange={e => setEditCourse({ ...editCourse, type: e.target.value })}
                  >
                    {COURSE_TYPES.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="https://example.com"
                  value={editCourse.url}
                  onChange={e => setEditCourse({ ...editCourse, url: e.target.value })}
                />
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditMode(false);
                  setEditCourse(null);
                }}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course content management modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Course Content: {selectedCourse.name}</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedCourse(null)}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'lessons' ? 'border-blue-600 text-blue-600' : 'border-transparent'
                      }`}
                    onClick={() => {
                      setActiveTab('lessons');
                      fetchLessons(selectedCourse.id);
                    }}
                  >
                    Lessons
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'quizzes' ? 'border-blue-600 text-blue-600' : 'border-transparent'
                      }`}
                    onClick={() => {
                      setActiveTab('quizzes');
                      fetchQuizzes(selectedCourse.id);
                    }}
                  >
                    Quizzes
                  </button>
                </li>
              </ul>
            </div>

            {/* Lessons Tab */}
            {activeTab === 'lessons' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Lessons</h3>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
                    onClick={() => {
                      setCurrentLesson({
                        title: "",
                        content: "",
                        materialUrl: "",
                        lessonOrder: 0,
                        courseId: selectedCourse.id
                      });
                      setShowLessonModal(true);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Lesson
                  </button>
                </div>

                {/* Lessons List */}
                {loading ? (
                  <div className="flex justify-center py-4">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : lessons.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No lessons found for this course</p>
                ) : (
                  <div className="space-y-4">
                    {lessons.map((lesson, index) => (
                      <div key={lesson.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-lg">{index + 1}. {lesson.title}</h4>
                            {lesson.materialUrl && (
                              <p className="text-sm text-blue-600 mt-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path d="M2 6a2 2 0 002-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                  <path d="M14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                                </svg>
                                <a href={lesson.materialUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  Material Link
                                </a>
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => {
                                setCurrentLesson({
                                  ...lesson,
                                  courseId: lesson.course?.id // Thêm dòng này
                                });
                                setShowLessonModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {lesson.content && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lesson.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Course Quiz</h3>
                  {/* Chỉ hiển thị nút thêm Quiz khi chưa có quiz nào */}
                  {quizzes.length === 0 && (
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
                      onClick={() => {
                        setCurrentQuiz({
                          title: `Quiz for ${selectedCourse.name}`,
                          questions: [],
                          courseId: selectedCourse.id
                        });
                        setShowQuizModal(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Quiz
                    </button>
                  )}
                </div>

                {/* Quizzes List */}
                {loading ? (
                  <div className="flex justify-center py-4">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : quizzes.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No quizzes found for this course</p>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-lg">{quiz.title}</h4>
                          <div className="flex space-x-2">
                            <button
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => {
                                setCurrentQuiz({ ...quiz });
                                setShowQuizModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {quiz.questions?.length || 0} questions
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {currentLesson.id ? "Edit Lesson" : "Add New Lesson"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowLessonModal(false)}
              >
                ✕
              </button>
            </div>

            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lesson Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={currentLesson.title}
                  onChange={e => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Material URL</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={currentLesson.materialUrl || ''}
                  onChange={e => setCurrentLesson({ ...currentLesson, materialUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows="5"
                  value={currentLesson.content || ''}
                  onChange={e => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                  placeholder="Lesson content or description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={currentLesson.lessonOrder || 0}
                  onChange={e => setCurrentLesson({ ...currentLesson, lessonOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowLessonModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleSaveLesson}
              >
                {currentLesson.id ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Course Quiz Management
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowQuizModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold">Questions</h3>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center"
                  onClick={() => setShowQuestionModal(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Question
                </button>
              </div>

              {currentQuiz.questions?.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {currentQuiz.questions.map((question, idx) => (
                    <div key={idx} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between">
                        <h4 className="font-medium">Question {idx + 1}</h4>
                        <div className="space-x-2">
                          <button 
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => handleEditQuestion(idx)}
                          >
                            Edit
                          </button>
                          
                          {/* Các nút xóa đã có sẵn */}
                          {question.id ? (
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              Delete
                            </button>
                          ) : (
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveQuestion(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="my-2">{question.content}</p>
                      <div className="ml-4 space-y-1">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center">
                            <span className={option.isCorrect ? "text-green-600 font-medium" : "text-gray-600"}>
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="ml-2">{option.text}</span>
                            {option.isCorrect && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">
                                Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center mt-3 text-gray-500">No questions added yet</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowQuizModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleSaveQuiz}
                disabled={currentQuiz.questions?.length === 0}
              >
                {currentQuiz.id ? "Update" : "Create"} Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Question</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowQuestionModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question <span className="text-red-500">*</span></label>
              <textarea
                className="block w-full border rounded px-3 py-2"
                rows="2"
                value={currentQuestion.content}
                onChange={e => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
                required
                placeholder="Enter the question here..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Options <span className="text-red-500">*</span>
                <span className="text-xs font-normal ml-2">(Check the correct answer(s))</span>
              </label>

              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <span className="mr-2 text-sm font-medium">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    className="flex-grow border rounded px-3 py-1"
                    value={option.text}
                    onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <label className="inline-flex items-center ml-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={option.isCorrect}
                      onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                    />
                    <span className="ml-1 text-xs text-gray-700">Correct</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowQuestionModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleAddQuestion}
                disabled={!currentQuestion.content || !currentQuestion.options.some(o => o.text.trim() !== "")}
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}