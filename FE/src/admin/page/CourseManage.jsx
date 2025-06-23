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
  const [loading, setLoading] = useState(false); // Thêm loading state

  // Lấy danh sách khóa học, backend đã lọc những khóa học đã xóa
  const fetchCourses = async () => {
    setLoading(true); // Bắt đầu loading
    try {
      const res = await api.get("/courses/list"); // Dùng API chuyên biệt đã filter
      setCourses(res.data || []); // Không cần filter lại
    } catch (err) {
      toast.error("Failed to load courses!");
      if (err.response) {
        console.error("Backend error:", err.response.data);
      }
    } finally {
      setLoading(false); // Kết thúc loading
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Kiểm tra định dạng ngày tháng
  const isValidDateFormat = (dateString) => {
    // Kiểm tra định dạng yyyy-MM-dd
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
    // Chỉ cần gửi dữ liệu khóa học, backend tự set isDeleted=false
    const payload = { ...newCourse };
    try {
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
    }
  };

  // Xóa khóa học
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await api.delete(`/courses/${id}`);
        toast.success("Delete course successfully!");
        fetchCourses();
      } catch (err) {
        toast.error("Delete failed!");
        if (err.response) {
          console.error("Delete error:", err.response.data);
        }
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
    // Không cần gửi trường isDeleted khi cập nhật
    const payload = { ...editCourse };
    try {
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
    }
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
              placeholder="Search by name , type or age group"
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
            {loading ? (
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
                  <td className="px-6 py-4 whitespace-nowrap">{course.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.startDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{course.endDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.targetAgeGroup === "Teenagers" ? "bg-blue-100 text-blue-800" : 
                      course.targetAgeGroup === "Adults" ? "bg-green-100 text-green-800" : 
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {course.targetAgeGroup || "Unspecified"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      course.type === "WORKSHOP" ? "bg-purple-100 text-purple-800" :
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
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
    </div>
  );
}