import React, { useEffect, useState } from "react";
import api from "../../config/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { uploadImageToCloudinary } from "../../services/uploadCloudinary";

export default function CourseManage() {
  const [courses, setCourses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    durationInMinutes: 0,
    targetAgeGroup: "",
    url: "",
    isDeleted: false,
    deleted: false
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", or "ended"

  // States for lesson and quiz management
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const COURSES_PER_PAGE = 6;
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
  const [editQuestionIndex, setEditQuestionIndex] = useState(null);

  // Fetch courses
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

  // Validate date format
  const isValidDateFormat = (dateString) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  };

  // Create new course
  const handleCreate = async () => {
    if (!newCourse.name || !newCourse.startDate || !newCourse.endDate) {
      toast.error("Please fill in all required fields!");
      return;
    }
    if (!isValidDateFormat(newCourse.startDate) || !isValidDateFormat(newCourse.endDate)) {
      toast.error("Invalid date format");
      return;
    }

    // Tạo payload với durationInMinutes đảm bảo là số nguyên
    const payload = {
      ...newCourse,
      durationInMinutes: parseInt(newCourse.durationInMinutes) || 0, // Đảm bảo là số nguyên
      isDeleted: Boolean(newCourse.isDeleted), // Đảm bảo là boolean
      deleted: Boolean(newCourse.deleted) // Đảm bảo là boolean
    };

    console.log("POST Request Payload:", payload);
    console.log("Payload data types:", {
      durationInMinutes: typeof payload.durationInMinutes,
      isDeleted: typeof payload.isDeleted,
      deleted: typeof payload.deleted
    });

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
        durationInMinutes: 0,
        targetAgeGroup: "",
        url: "",
        isDeleted: false,
        deleted: false
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

  // Delete course
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

  // Save course edits
  const handleSave = async () => {
    if (!editCourse.name || !editCourse.startDate || !editCourse.endDate) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }
    if (!isValidDateFormat(editCourse.startDate) || !isValidDateFormat(editCourse.endDate)) {
      toast.error("Định dạng ngày không hợp lệ");
      return;
    }

    // Tạo payload theo đúng API specification
    const payload = {
      id: parseInt(editCourse.id), // Đảm bảo ID là số nguyên
      name: editCourse.name,
      description: editCourse.description || "",
      startDate: editCourse.startDate,
      endDate: editCourse.endDate,
      durationInMinutes: parseInt(editCourse.durationInMinutes) || 0, // Đảm bảo là số nguyên
      targetAgeGroup: editCourse.targetAgeGroup || "Teenagers",
      url: editCourse.url || ""
      // Không gửi isDeleted vì API không hỗ trợ, chỉ có deleted
    };

    console.log("PUT Request Payload:", payload);
    console.log("PUT Request URL:", `/courses/${editCourse.id}`);
    console.log("Payload data types:", {
      id: typeof payload.id,
      durationInMinutes: typeof payload.durationInMinutes
    });

    try {
      setLoading(true);

      // Thêm validation để đảm bảo dữ liệu hợp lệ
      if (!payload.id) {
        throw new Error("Course ID is required");
      }

      console.log("Sending PUT request...");
      const response = await api.put(`/courses/${editCourse.id}`, payload);
      console.log("PUT Response:", response);
      console.log("Response Status:", response.status);
      console.log("Response Data:", response.data);

      // Coi như thành công nếu không có lỗi throw
      toast.success("Cập nhật khóa học thành công!");

      // Cập nhật state courses ngay lập tức với dữ liệu từ response
      console.log('Updating course state with response data:', {
        editCourseId: editCourse.id,
        editCourseIdType: typeof editCourse.id,
        responseData: response.data
      });

      setCourses(prevCourses => {
        const updatedCourses = prevCourses.map(course => {
          console.log('Comparing:', {
            courseId: course.id,
            courseIdType: typeof course.id,
            editCourseId: editCourse.id,
            editCourseIdType: typeof editCourse.id,
            isMatch: parseInt(course.id) === parseInt(editCourse.id)
          });
          return parseInt(course.id) === parseInt(editCourse.id) ? response.data : course;
        });
        console.log('Updated courses state:', updatedCourses);
        return updatedCourses;
      });

      setEditMode(false);
      setEditCourse(null);

      // Refresh dữ liệu từ server để đảm bảo đồng bộ
      await fetchCourses();
    } catch (err) {
      console.error("PUT Request Error:", err);

      if (err.response) {
        console.error("Error Response Status:", err.response.status);
        console.error("Error Response Data:", err.response.data);
        console.error("Error Response Headers:", err.response.headers);

        // Hiển thị lỗi chi tiết từ backend
        const errorMessage = err.response.data?.message || err.response.data?.error || "Cập nhật khóa học thất bại!";
        toast.error(`Lỗi ${err.response.status}: ${errorMessage}`);
      } else if (err.request) {
        console.error("Error Request:", err.request);
        toast.error("Không thể kết nối đến server!");
      } else {
        console.error("Error Message:", err.message);
        toast.error("Có lỗi xảy ra khi cập nhật khóa học!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons by course
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

  // Fetch quizzes by course
  const fetchQuizzes = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.get(`/quiz/course/${courseId}`);
      const quizData = res.data || [];

      // Create question set for this course
      const questions = quizData.map(item => {
        let options = [];
        try {
          options = JSON.parse(item.answer);
          if (!Array.isArray(options)) options = [item.answer];
        } catch {
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

      // Tạo một quiz duy nhất cho mỗi khóa học
      const formattedQuizzes = [{
        id: courseId,
        courseId: courseId,
        title: `Bài kiểm tra khóa học ${selectedCourse.name}`,
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


  // Save lesson
  const handleSaveLesson = async () => {
    const courseIdToUse = currentLesson.courseId || selectedCourse.id;

    if (!currentLesson.title || !courseIdToUse) {
      toast.error("Vui lòng nhập tiêu đề bài học");
      return;
    }

    try {
      setLoading(true);

      const lessonPayload = {
        title: currentLesson.title,
        content: currentLesson.content || "",
        materialUrl: currentLesson.materialUrl || "",
        lessonOrder: currentLesson.lessonOrder || 0,
        course: {
          id: courseIdToUse
        }
      };

      if (currentLesson.id) {
        lessonPayload.id = currentLesson.id;
      }

      if (currentLesson.id) {
        await api.put(`/lessons/${currentLesson.id}`, lessonPayload);
        toast.success("Cập nhật bài học thành công");
      } else {
        await api.post("/lessons", lessonPayload);
        toast.success("Thêm bài học thành công");
      }

      // Đảm bảo lấy dữ liệu mới nhất từ server
      await fetchLessons(courseIdToUse);
      setShowLessonModal(false);
    } catch (error) {
      toast.error(currentLesson.id ? "Cập nhật bài học thất bại" : "Thêm bài học thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete lesson
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

  // Save quiz
  const handleSaveQuiz = async () => {
    if (!selectedCourse || !quizzes[0] || quizzes[0].questions.length === 0) {
      toast.error("Không có câu hỏi nào để lưu");
      return;
    }

    try {
      setLoading(true);

      const quizQuestions = quizzes[0].questions.map((q) => {
        const correctOptionIndex = q.options.findIndex(opt => opt.isCorrect);

        return {
          courseId: selectedCourse.id,
          question: q.content,
          answer: JSON.stringify(q.options.map(opt => opt.text)),
          correct: correctOptionIndex + 1,
          ...(q.id ? { id: q.id } : {})
        };
      });

      for (const question of quizQuestions) {
        if (question.id) {
          await api.put(`/quiz/${question.id}`, question);
        } else {
          await api.post("/quiz", question);
        }
      }

      toast.success("Câu hỏi kiểm tra đã được lưu thành công");
      fetchQuizzes(selectedCourse.id);
    } catch (error) {
      toast.error("Lưu câu hỏi kiểm tra thất bại");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        setLoading(true);
        await api.delete(`/quiz/${id}`);
        toast.success("Question deleted successfully");
        fetchQuizzes(selectedCourse.id);
      } catch (error) {
        toast.error("Failed to delete question");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Add question to quiz
  const handleAddQuestion = () => {
    // Kiểm tra nội dung câu hỏi
    if (!currentQuestion.content.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi");
      return;
    }

    // Kiểm tra đáp án
    if (!currentQuestion.options.some(option => option.isCorrect)) {
      toast.error("Vui lòng chọn ít nhất một đáp án đúng");
      return;
    }

    // Nếu chưa có câu hỏi nào, tạo quiz mới
    if (quizzes.length === 0) {
      const newQuiz = {
        id: selectedCourse.id,
        courseId: selectedCourse.id,
        title: `Bài kiểm tra khóa học ${selectedCourse.name}`,
        questions: [currentQuestion]
      };
      setQuizzes([newQuiz]);
    } else {
      // Cập nhật quiz hiện có
      const updatedQuestions = [...quizzes[0].questions];
      if (editQuestionIndex !== null) {
        updatedQuestions[editQuestionIndex] = currentQuestion;
      } else {
        updatedQuestions.push(currentQuestion);
      }

      setQuizzes([{
        ...quizzes[0],
        questions: updatedQuestions
      }]);
    }

    // Đóng modal câu hỏi và reset form
    setShowQuestionModal(false);
    setEditQuestionIndex(null);
    setCurrentQuestion({
      content: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ]
    });

    toast.success(editQuestionIndex !== null ? "Cập nhật câu hỏi thành công" : "Thêm câu hỏi thành công");
  };

  // Edit question
  const handleEditQuestion = (index) => {
    setCurrentQuestion({ ...quizzes[0].questions[index] });
    setEditQuestionIndex(index);
    setShowQuestionModal(true);
  };

  // Remove question from list
  const handleRemoveQuestion = (index) => {
    const updatedQuestions = [...quizzes[0].questions];
    updatedQuestions.splice(index, 1);
    setQuizzes([{ ...quizzes[0], questions: updatedQuestions }]);
    toast.success("Đã xóa câu hỏi");
  };

  // Filter courses
  const filteredCourses = courses.filter(
    (c) => {
      // Filter by search term
      const matchesSearch = !searchTerm ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.targetAgeGroup && c.targetAgeGroup.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by status
      const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.endDate >= currentDate) ||
        (statusFilter === "ended" && c.endDate < currentDate);

      return matchesSearch && matchesStatus;
    }
  );

  // Age group options
  const AGE_GROUPS = [
    { value: "", label: "Select Age Group" },
    { value: "Teenagers", label: "Teenagers" },
    { value: "Adults", label: "Adults" }
  ];

  // Handle option changes
  const handleOptionChange = (optionIndex, field, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[optionIndex] = {
      ...updatedOptions[optionIndex],
      [field]: value
    };

    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions
    });
  };

  // Age group styles
  const getAgeGroupStyles = (ageGroup) => {
    switch (ageGroup) {
      case "Teenagers":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          icon: <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10C20 4.477 15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" clipRule="evenodd" /></svg>
        };
      case "Adults":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
        };
    }
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Tính toán dữ liệu hiển thị theo trang
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE
  );

  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
  const handleCourseImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    setLoading(true);
    const url = await uploadImageToCloudinary(file);
    setNewCourse(prev => ({ ...prev, url }));
    if (editMode && editCourse) {
      setEditCourse(prev => ({ ...prev, url }));
    }
    toast.success("Tải ảnh thành công!");
  } catch (err) {
    toast.error("Tải ảnh thất bại!");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header - Giống Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 rounded-3xl shadow-lg mx-6 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center text-white">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold">Quản Lý Khóa Học</h1>
              </div>
              <p className="text-blue-100 text-lg">
                Tạo, chỉnh sửa và quản lý tất cả khóa học trong hệ thống
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0 text-right">
              <div className="text-blue-100 text-sm mb-1">Hôm nay</div>
              <div className="text-xl font-bold">{new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</div>
              <div className="text-blue-200 text-sm mt-1">
                {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Danh sách khóa học</h2>
            <p className="text-gray-600 mt-1">Quản lý và tổ chức các khóa học</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center shadow-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Thêm khóa học
          </button>
        </div>

        {/* Search and filter bar */}
        <div className="mb-8 bg-white shadow-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học theo tên hoặc nhóm tuổi..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="pl-3 pr-10 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchTerm(e.target.value);
                  }
                }}
              >
                <option value="">Lọc theo nhóm tuổi</option>
                <option value="Teenagers">Thanh thiếu niên</option>
                <option value="Adults">Người lớn</option>
              </select>

              {searchTerm && (
                <button
                  className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setSearchTerm("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Filter info */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Hiển thị {filteredCourses.length} trong tổng số {courses.length} khóa học
              {searchTerm && ` với từ khóa "${searchTerm}"`}
            </p>

            {/* Status filter buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${statusFilter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                onClick={() => setStatusFilter("all")}
              >
                Tất cả khóa học
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${statusFilter === "active"
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                onClick={() => setStatusFilter("active")}
              >
                Đang hoạt động
              </button>
              <button
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${statusFilter === "ended"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                onClick={() => setStatusFilter("ended")}
              >
                Đã kết thúc
              </button>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="mt-4">
          {loading && !selectedCourse ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : paginatedCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Không tìm thấy khóa học</h3>
              <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm khóa học đầu tiên hoặc thay đổi bộ lọc.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Thêm khóa học
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCourses.map((course) => {
                const ageGroupStyle = getAgeGroupStyles(course.targetAgeGroup);
                return (
                  <div key={course.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{course.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ageGroupStyle.bg} ${ageGroupStyle.text}`}>
                          {ageGroupStyle.icon}
                          {course.targetAgeGroup || "Không xác định"}
                        </span>
                      </div>

                      <p className="mt-2 text-gray-600 text-sm">
                        {course.description ? (course.description.length > 150 ? course.description.substring(0, 150) + '...' : course.description) : "Không có mô tả"}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          Bắt đầu: {course.startDate}
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          Kết thúc: {course.endDate}
                        </div>
                        {course.durationInMinutes > 0 && (
                          <div className="flex items-center col-span-2">
                            <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Thời gian: {course.durationInMinutes} phút
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">ID: {course.id}</span>
                      <div className="flex space-x-2">
                        <button
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          onClick={() => {
                            setEditMode(true);
                            setEditCourse({ ...course });
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          onClick={() => {
                            setSelectedCourse(course);
                            setActiveTab('lessons');
                            fetchLessons(course.id);
                          }}
                        >
                          Quản lý nội dung
                        </button>
                        <button
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                          onClick={() => handleDelete(course.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-6">
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Create course modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-full sm:max-w-md mx-2 max-h-[80vh] flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Thêm Khóa Học Mới</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Ảnh khóa học</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    onChange={handleCourseImageUpload}
                  />
                  {newCourse.url && (
                    <img src={newCourse.url} alt="Course" className="mt-2 h-24 rounded shadow" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (phút)</label>

                  {/* Quick Select Options */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[30, 60, 90, 120].map(duration => (
                      <button
                        key={duration}
                        type="button"
                        className={`px-3 py-2 text-sm rounded border ${newCourse.durationInMinutes === duration
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        onClick={() => setNewCourse({ ...newCourse, durationInMinutes: duration })}
                      >
                        {duration}p
                      </button>
                    ))}
                  </div>

                  {/* Custom Input with Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded"
                      onClick={() => setNewCourse({
                        ...newCourse,
                        durationInMinutes: Math.max(0, (newCourse.durationInMinutes || 0) - 15)
                      })}
                    >
                      -15
                    </button>

                    <input
                      type="number"
                      className="flex-1 border rounded px-3 py-2 text-center"
                      placeholder="0"
                      min="0"
                      step="5"
                      value={newCourse.durationInMinutes}
                      onChange={e => setNewCourse({ ...newCourse, durationInMinutes: parseInt(e.target.value) || 0 })}
                    />

                    <button
                      type="button"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded"
                      onClick={() => setNewCourse({
                        ...newCourse,
                        durationInMinutes: (newCourse.durationInMinutes || 0) + 15
                      })}
                    >
                      +15
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Chọn nhanh hoặc nhập số phút tùy chỉnh
                  </p>
                </div>
              </form>
            </div>
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
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-full sm:max-w-md mx-2 max-h-[90vh] flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Chỉnh Sửa Khóa Học</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Ảnh khóa học</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full border rounded px-3 py-2"
                    onChange={handleCourseImageUpload}
                  />
                  {editCourse.url && (
                    <img src={editCourse.url} alt="Course" className="mt-2 h-24 rounded shadow" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (phút)</label>

                  {/* Quick Select Options */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[30, 60, 90, 120].map(duration => (
                      <button
                        key={duration}
                        type="button"
                        className={`px-3 py-2 text-sm rounded border ${(editCourse.durationInMinutes || 0) === duration
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        onClick={() => setEditCourse({ ...editCourse, durationInMinutes: duration })}
                      >
                        {duration}p
                      </button>
                    ))}
                  </div>

                  {/* Custom Input with Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded"
                      onClick={() => setEditCourse({
                        ...editCourse,
                        durationInMinutes: Math.max(0, (editCourse.durationInMinutes || 0) - 15)
                      })}
                    >
                      -15
                    </button>

                    <input
                      type="number"
                      className="flex-1 border rounded px-3 py-2 text-center"
                      placeholder="0"
                      min="0"
                      step="5"
                      value={editCourse.durationInMinutes || 0}
                      onChange={e => setEditCourse({ ...editCourse, durationInMinutes: parseInt(e.target.value) || 0 })}
                    />

                    <button
                      type="button"
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded"
                      onClick={() => setEditCourse({
                        ...editCourse,
                        durationInMinutes: (editCourse.durationInMinutes || 0) + 15
                      })}
                    >
                      +15
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Chọn nhanh hoặc nhập số phút tùy chỉnh
                  </p>
                </div>
              </form>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditMode(false);
                  setEditCourse(null);
                }}
              >
                Hủy
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
                ) : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course content management modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {selectedCourse.name}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Quản lý bài học và bài kiểm tra cho khóa học này
                </p>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setSelectedCourse(null)}
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
              <div className="max-w-3xl mx-auto">
                <div className="flex space-x-4">
                  <button
                    className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'lessons'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => {
                      setActiveTab('lessons');
                      fetchLessons(selectedCourse.id);
                    }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Bài học
                    </div>
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === 'quizzes'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => {
                      setActiveTab('quizzes');
                      fetchQuizzes(selectedCourse.id);
                    }}
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                      Bài kiểm tra
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Content area with scrolling */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Lessons Tab */}
              {activeTab === 'lessons' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Danh sách bài học</h3>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center text-sm shadow-sm transition-colors"
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Thêm bài học
                    </button>
                  </div>

                  {/* Lessons List */}
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : lessons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      <h4 className="mt-4 text-lg font-medium">Chưa có bài học nào</h4>
                      <p className="mt-2 text-sm text-gray-500">Bắt đầu bằng cách thêm bài học đầu tiên cho khóa học này</p>
                      <button
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
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

                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                        Thêm bài học
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lessons.map(lesson => (
                        <div key={lesson.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                          <div className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-md font-semibold text-gray-800 line-clamp-1">{lesson.title}</h4>
                              <div className="text-xs font-medium rounded-full" style={{ paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.125rem', paddingBottom: '0.125rem', backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                                {lesson.lessonOrder}
                              </div>
                            </div>

                            <p className="mt-2 text-gray-600 text-sm">
                              {lesson.content ? (lesson.content.length > 150 ? lesson.content.substring(0, 150) + '...' : lesson.content) : "Không có mô tả"}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">
                              {lesson.materialUrl && (
                                <a
                                  href={lesson.materialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h10m-5 4h5" />
                                  </svg>
                                  Video bài học
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex justify-between items-center">
                            <span className="text-xs text-gray-500">ID: {lesson.id}</span>
                            <div className="flex space-x-2">
                              <button
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                                onClick={() => {
                                  setCurrentLesson(lesson);
                                  setShowLessonModal(true);
                                }}
                              >
                                Chỉnh sửa
                              </button>
                              <button
                                className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-medium transition-colors"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quizzes Tab */}
              {activeTab === 'quizzes' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Danh sách câu hỏi kiểm tra</h3>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center text-sm shadow-sm transition-colors"
                      onClick={() => {
                        setCurrentQuestion({
                          content: "",
                          options: [
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false },
                            { text: "", isCorrect: false }
                          ]
                        });
                        setEditQuestionIndex(null);
                        setShowQuestionModal(true);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Thêm câu hỏi mới
                    </button>
                  </div>

                  {/* Quizzes List */}
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : quizzes.length === 0 || (quizzes[0]?.questions && quizzes[0].questions.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                      <h4 className="mt-4 text-lg font-medium">Chưa có câu hỏi kiểm tra nào</h4>
                      <p className="mt-2 text-sm text-gray-500">Bắt đầu bằng cách thêm câu hỏi kiểm tra đầu tiên cho khóa học này</p>
                      <button
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"
                        onClick={() => {
                          setCurrentQuestion({
                            content: "",
                            options: [
                              { text: "", isCorrect: false },
                              { text: "", isCorrect: false },
                              { text: "", isCorrect: false },
                              { text: "", isCorrect: false }
                            ]
                          });
                          setEditQuestionIndex(null);
                          setShowQuestionModal(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                        Thêm câu hỏi mới
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-md font-semibold text-gray-800">Bài kiểm tra: {selectedCourse.name}</h4>
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {quizzes[0]?.questions?.length || 0} câu hỏi
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex flex-col space-y-3">
                            {quizzes[0]?.questions?.map((question, qIndex) => (
                              <div key={question.id || qIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium text-gray-700">
                                    {qIndex + 1}. {question.content}
                                  </p>
                                  <div className="flex space-x-1">
                                    <button
                                      className="p-1 text-indigo-600 hover:text-indigo-800"
                                      onClick={() => handleEditQuestion(qIndex)}
                                      title="Chỉnh sửa câu hỏi"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      className="p-1 text-red-600 hover:text-red-800"
                                      onClick={() => question.id ? handleDeleteQuestion(question.id) : handleRemoveQuestion(qIndex)}
                                      title="Xóa câu hỏi"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                                  {question.options.map((option, oIndex) => (
                                    <div
                                      key={oIndex}
                                      className={`text-xs px-2 py-1 rounded flex items-center ${option.isCorrect
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                      {option.isCorrect && (
                                        <svg className="w-3 h-3 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                        </svg>
                                      )}
                                      {option.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer với nút lưu và thêm câu hỏi */}
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
                          <button
                            type="button"
                            className="w-full sm:w-auto py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:border-indigo-300 focus:outline-none transition-colors flex items-center justify-center"
                            onClick={() => {
                              setCurrentQuestion({
                                content: "",
                                options: [
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false },
                                  { text: "", isCorrect: false }
                                ]
                              });
                              setEditQuestionIndex(null);
                              setShowQuestionModal(true);
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm câu hỏi
                          </button>

                          <button
                            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center"
                            onClick={() => handleSaveQuiz()}
                            disabled={loading || !quizzes[0] || quizzes[0].questions.length === 0}
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang lưu...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Lưu thay đổi
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{currentLesson.id ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowLessonModal(false)}>
                ✕
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  value={currentLesson.title}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows="12" // Tăng số dòng hiển thị
                  value={currentLesson.content}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, content: e.target.value })}
                  placeholder="Nhập nội dung bài học không giới hạn ký tự..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">URL tài liệu</label>
                <input
                  type="text"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  placeholder="https://example.com/document.pdf"
                  value={currentLesson.materialUrl}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, materialUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Thứ tự bài học</label>
                <input
                  type="number"
                  className="mt-1 block w-full border rounded px-3 py-2"
                  min="0"
                  value={currentLesson.lessonOrder}
                  onChange={(e) => setCurrentLesson({ ...currentLesson, lessonOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
            </form>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowLessonModal(false)}
              >
                Hủy
              </button>
              <button
                className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleSaveLesson}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-y-auto py-6">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editQuestionIndex !== null ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowQuestionModal(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi <span className="text-red-500">*</span></label>
                <textarea
                  className="mt-1 block w-full border rounded px-3 py-2"
                  rows="3"
                  value={currentQuestion.content}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Các đáp án <span className="text-red-500">*</span></label>
                <p className="text-xs text-gray-500 mb-2">Chọn ít nhất một đáp án đúng</p>

                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    />
                    <input
                      type="text"
                      className={`block w-full border rounded px-3 py-2 ${option.isCorrect ? 'bg-green-50 border-green-300' : ''}`}
                      placeholder={`Đáp án ${index + 1}`}
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowQuestionModal(false)}
              >
                Hủy
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleAddQuestion}
              >
                {editQuestionIndex !== null ? 'Cập nhật' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}