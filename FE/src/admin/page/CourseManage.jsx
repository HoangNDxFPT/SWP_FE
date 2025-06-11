import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CourseManage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    type: "",
    target_age_group: "",
    video_link: "",
    status: "pending"
  });

  // Giả lập role hiện tại
  const currentRole = "admin"; // hoặc "manager", "teacher"

  // Các lựa chọn cố định
  const typeOptions = ["Online", "Workshop", "Seminar", "Community"];
  const ageGroupOptions = [
    "Teenagers",      // Thiếu niên
    "Adults",         // Người lớn
    "All Ages"        // Mọi lứa tuổi
  ];

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetch("/src/data/data.json")
      .then((res) => res.json())
      .then((data) => {
        setCourses(data.Courses || []);
      });
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      setCourses(courses.filter((course) => course.id !== id));
      toast.success("Delete course successfully!");
    }
  };

  const handleSave = () => {
    fetch(`http://localhost:5000/Courses/${selectedCourse.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedCourse)
    })
      .then(res => {
        if (res.ok) {
          setCourses(courses.map(c => c.id === selectedCourse.id ? selectedCourse : c));
          setSelectedCourse(null);
          toast.success("Edit course successfully!");
        } else {
          toast.error("Edit failed!");
        }
      });
  };

  // Tạo mới khóa học
  const handleCreate = () => {
    if (!newCourse.name || !newCourse.type || !newCourse.target_age_group) {
      toast.error("Course name, type and target age group are required!");
      return;
    }
    const newCourseData = {
      ...newCourse,
      id: (Math.max(0, ...courses.map(c => +c.id || 0)) + 1).toString(),
      status: "pending"
    };
    fetch("http://localhost:5000/Courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourseData)
    })
      .then(res => res.json())
      .then(data => {
        setCourses([...courses, data]);
        setShowCreate(false);
        setNewCourse({
          name: "",
          description: "",
          start_date: "",
          end_date: "",
          type: "",
          target_age_group: "",
          video_link: "",
          status: "pending"
        });
        toast.success("Course created and waiting for approval!");
      });
  };

  // Duyệt hoặc từ chối khóa học
  const handleApproveCourse = (id) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const updated = { ...course, status: "approved" };
    fetch(`http://localhost:5000/Courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(res => {
        if (res.ok) {
          setCourses(courses.map(c => c.id === id ? updated : c));
          toast.success("Course approved!");
        } else {
          toast.error("Approve failed!");
        }
      });
  };

  // TỪ CHỐI KHÓA HỌC
  const handleRejectCourse = (id) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    const updated = { ...course, status: "rejected" };
    fetch(`http://localhost:5000/Courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
      .then(res => {
        if (res.ok) {
          setCourses(courses.map(c => c.id === id ? updated : c));
          toast.success("Course rejected!");
        } else {
          toast.error("Reject failed!");
        }
      });
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
    (filterAge ? course.target_age_group === filterAge : true) &&
    (filterDate ? course.start_date === filterDate : true)
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
            <option key={age} value={age}>{age}</option>
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
              <th className="px-4 py-2 text-left text-xs font-semibold text-white">Status</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No courses available
                </td>
              </tr>
            ) : (
              filteredCourses.map((course, index) => (
                <tr key={course.id} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{course.name}</td>
                  <td className="px-4 py-2">{course.type}</td>
                  <td className="px-4 py-2">{course.target_age_group}</td>
                  <td className="px-4 py-2 capitalize">{course.status || "approved"}</td>
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
                    {(currentRole === "admin" || currentRole === "manager") && course.status === "pending" && (
                      <>
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                          onClick={() => handleApproveCourse(course.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                          onClick={() => handleRejectCourse(course.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
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
                  value={selectedCourse.start_date}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <b>End Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.end_date}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, end_date: e.target.value })
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
                  value={selectedCourse.target_age_group}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, target_age_group: e.target.value })
                  }
                >
                  <option value="">Select age group</option>
                  {ageGroupOptions.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>URL:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={selectedCourse.video_link || ""}
                  onChange={e =>
                    setSelectedCourse({ ...selectedCourse, video_link: e.target.value })
                  }
                  placeholder="Enter video link"
                />
                {selectedCourse.video_link && (
                  <a
                    href={selectedCourse.video_link}
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
                  value={newCourse.start_date}
                  onChange={e =>
                    setNewCourse({ ...newCourse, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <b>End Date:</b>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.end_date}
                  onChange={e =>
                    setNewCourse({ ...newCourse, end_date: e.target.value })
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
                  value={newCourse.target_age_group}
                  onChange={e =>
                    setNewCourse({ ...newCourse, target_age_group: e.target.value })
                  }
                >
                  <option value="">Select age group</option>
                  {ageGroupOptions.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
              <div>
                <b>URL:</b>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={newCourse.video_link}
                  onChange={e =>
                    setNewCourse({ ...newCourse, video_link: e.target.value })
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