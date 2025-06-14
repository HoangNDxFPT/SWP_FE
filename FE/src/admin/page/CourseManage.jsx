import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import api from "../../config/axios";
import "react-toastify/dist/ReactToastify.css";

export default function CourseManage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    type: "",
    targetAgeGroup: "",
    url: ""
  });

  // Các lựa chọn cố định
  const typeOptions = ["Online", "Workshop", "Seminar", "Community"];
  const ageGroupOptions = [
    { value: "Teenagers", label: "Teenagers" },
    { value: "Adults", label: "Adults" },
    { value: "AllAges", label: "All Ages" }
  ];

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Lấy danh sách khóa học từ API
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data || []);
    } catch {
      toast.error("Không thể tải danh sách khóa học!");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Xóa khóa học
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await api.delete(`/courses/${id}`);
        toast.success("Delete course successfully!");
        fetchCourses();
      } catch {
        toast.error("Delete failed!");
      }
    }
  };

  // Lưu chỉnh sửa khóa học
  const handleSave = async () => {
    try {
      await api.put(`/courses/${selectedCourse.id}`, selectedCourse);
      toast.success("Edit course successfully!");
      setSelectedCourse(null);
      fetchCourses();
    } catch {
      toast.error("Edit failed!");
    }
  };

  // Tạo mới khóa học
  const handleCreate = async () => {
    if (!newCourse.name || !newCourse.type || !newCourse.targetAgeGroup) {
      toast.error("Course name, type and target age group are required!");
      return;
    }
    try {
      await api.post("/courses", newCourse);
      toast.success("Course created!");
      setShowCreate(false);
      setNewCourse({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
        type: "",
        targetAgeGroup: "",
        url: ""
      });
      fetchCourses();
    } catch {
      toast.error("Create failed!");
    }
  };

  // Reset filter function
  const handleReset = () => {
    setFilterName("");
    setFilterAge("");
    setFilterDate("");
  };

  // Filtered courses
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(filterName.toLowerCase()) &&
    (filterAge ? course.targetAgeGroup === filterAge : true) &&
    (filterDate ? course.startDate === filterDate : true)
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Course Management</h1>
      <button
        className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        onClick={() => setShowCreate(true)}
      >
        Create Course
      </button>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Filter by course name"
          className="border rounded px-2 py-1"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1"
          value={filterAge}
          onChange={e => setFilterAge(e.target.value)}
        >
          <option value="">All age groups</option>
          {ageGroupOptions.map(age => (
            <option key={age.value} value={age.value}>{age.label}</option>
          ))}
        </select>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">No.</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Course Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Target Age Group</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Start Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">End Date</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-gray-500">
                  No courses available
                </td>
              </tr>
            ) : (
              filteredCourses.map((course, index) => (
                <tr key={course.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{course.name}</td>
                  <td className="px-4 py-2">{course.type}</td>
                  <td className="px-4 py-2">{course.targetAgeGroup}</td>
                  <td className="px-4 py-2">{course.startDate}</td>
                  <td className="px-4 py-2">{course.endDate}</td>
                  <td className="px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      onClick={() => setSelectedCourse(course)}
                    >
                      View / Edit
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

      {/* Modal for course details and edit */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Course Details & Edit</h2>
            <div className="space-y-2">
              <div>
                <b>Course Name:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.name}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, name: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Description:</b>
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.description}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, description: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Start Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.startDate || ""}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <b>End Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.endDate || ""}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Type:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.type}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, type: e.target.value })
                  }
                >
                  <option value="">Select type</option>
                  {typeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>Target Age Group:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse?.targetAgeGroup || ""}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, targetAgeGroup: e.target.value })
                  }
                >
                  <option value="">Select age group</option>
                  {ageGroupOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>URL:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.url || ""}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, url: e.target.value })
                  }
                  placeholder="Enter video link"
                />
                {selectedCourse.url && (
                  <a
                    href={selectedCourse.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all block mt-1"
                  >
                    
                  </a>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setSelectedCourse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for create course */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
            <h2 className="text-xl font-bold mb-4">Create New Course</h2>
            <div className="space-y-2">
              <div>
                <b>Course Name:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.name}
                  onChange={e =>
                    setNewCourse({ ...newCourse, name: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Description:</b>
                <textarea
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.description}
                  onChange={e =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Start Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.startDate}
                  onChange={e =>
                    setNewCourse({ ...newCourse, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <b>End Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.endDate}
                  onChange={e =>
                    setNewCourse({ ...newCourse, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <b>Type:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.type}
                  onChange={e =>
                    setNewCourse({ ...newCourse, type: e.target.value })
                  }
                >
                  <option value="">Select type</option>
                  {typeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>Target Age Group:</b>
                <select
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.targetAgeGroup}
                  onChange={e =>
                    setNewCourse({ ...newCourse, targetAgeGroup: e.target.value })
                  }
                >
                  <option value="">Select age group</option>
                  {ageGroupOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>URL:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.url}
                  onChange={e =>
                    setNewCourse({ ...newCourse, url: e.target.value })
                  }
                  placeholder="Enter video link"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={handleCreate}
              >
                Create
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}