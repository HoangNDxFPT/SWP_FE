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
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
    <div>
      <ToastContainer position="top-right" autoClose={2000} />
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Course Management</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name or description"
          className="border rounded px-2 py-1"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => setShowCreate(true)}
        >
          Add Course
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Description</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Start Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">End Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Target Age</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">URL</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  No courses found
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{course.id}</td>
                  <td className="px-4 py-2">{course.name}</td>
                  <td className="px-4 py-2">{course.description}</td>
                  <td className="px-4 py-2">{course.startDate}</td>
                  <td className="px-4 py-2">{course.endDate}</td>
                  <td className="px-4 py-2">{course.targetAgeGroup}</td>
                  <td className="px-4 py-2">{course.type}</td>
                  <td className="px-4 py-2">
                    {course.url ? (
                      <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
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
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add New Course</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Name"
                className="border rounded px-2 py-1"
                value={newCourse.name}
                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="border rounded px-2 py-1"
                value={newCourse.description}
                onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
              />
              <input
                type="date"
                placeholder="Start Date"
                className="border rounded px-2 py-1"
                value={newCourse.startDate}
                onChange={e => setNewCourse({ ...newCourse, startDate: e.target.value })}
              />
              <input
                type="date"
                placeholder="End Date"
                className="border rounded px-2 py-1"
                value={newCourse.endDate}
                onChange={e => setNewCourse({ ...newCourse, endDate: e.target.value })}
              />
              {/* Select cho targetAgeGroup */}
              <select
                className="border rounded px-2 py-1"
                value={newCourse.targetAgeGroup}
                onChange={e => setNewCourse({ ...newCourse, targetAgeGroup: e.target.value })}
              >
                {AGE_GROUPS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Select cho type */}
              <select
                className="border rounded px-2 py-1"
                value={newCourse.type}
                onChange={e => setNewCourse({ ...newCourse, type: e.target.value })}
              >
                {COURSE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="URL"
                className="border rounded px-2 py-1"
                value={newCourse.url}
                onChange={e => setNewCourse({ ...newCourse, url: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleCreate}
                disabled={loading} // Thêm disabled khi đang xử lý
              >
                {loading ? "Creating..." : "Create"} {/* Hiển thị trạng thái loading */}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit course modal */}
      {editMode && editCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Course</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Name"
                className="border rounded px-2 py-1"
                value={editCourse.name}
                onChange={e => setEditCourse({ ...editCourse, name: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="border rounded px-2 py-1"
                value={editCourse.description}
                onChange={e => setEditCourse({ ...editCourse, description: e.target.value })}
              />
              <input
                type="date"
                placeholder="Start Date"
                className="border rounded px-2 py-1"
                value={editCourse.startDate}
                onChange={e => setEditCourse({ ...editCourse, startDate: e.target.value })}
              />
              <input
                type="date"
                placeholder="End Date"
                className="border rounded px-2 py-1"
                value={editCourse.endDate}
                onChange={e => setEditCourse({ ...editCourse, endDate: e.target.value })}
              />
              {/* Select cho targetAgeGroup */}
              <select
                className="border rounded px-2 py-1"
                value={editCourse.targetAgeGroup}
                onChange={e => setEditCourse({ ...editCourse, targetAgeGroup: e.target.value })}
              >
                {AGE_GROUPS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Select cho type */}
              <select
                className="border rounded px-2 py-1"
                value={editCourse.type}
                onChange={e => setEditCourse({ ...editCourse, type: e.target.value })}
              >
                {COURSE_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="URL"
                className="border rounded px-2 py-1"
                value={editCourse.url}
                onChange={e => setEditCourse({ ...editCourse, url: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSave}
                disabled={loading} // Thêm disabled khi đang xử lý
              >
                {loading ? "Saving..." : "Save"} {/* Hiển thị trạng thái loading */}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditMode(false);
                  setEditCourse(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}