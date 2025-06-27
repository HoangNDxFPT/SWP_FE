import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CourseEnrollmentManage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [courseFilter, setCourseFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEnrollment, setCurrentEnrollment] = useState({
    id: null,
    userId: '',
    courseId: '',
    enrollmentDate: '',
    status: 'ENROLLED',
  });

  useEffect(() => {
    Promise.all([
      fetchEnrollments(),
      fetchCourses(),
      fetchUsers()
    ]);
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enrollments/enroll');
      setEnrollments(response.data);
      return response.data;
    } catch (error) {
      toast.error('Failed to load enrollments');
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/list');
      setCourses(response.data);
      return response.data;
    } catch (error) {
      toast.error('Failed to load courses');
      console.error(error);
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/profile/all');
      setUsers(response.data);
      return response.data;
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
      return [];
    }
  };

  const handleCreateEnrollment = async () => {
    try {
      setLoading(true);
      const response = await api.post('/enrollments/enroll', currentEnrollment);
      setEnrollments([...enrollments, response.data]);
      toast.success('Enrollment created successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create enrollment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnrollment = async () => {
    try {
      setLoading(true);
      await api.put(`/admin/course-enrollments/${currentEnrollment.id}`, currentEnrollment);
      
      const updatedEnrollments = enrollments.map(enrollment => 
        enrollment.id === currentEnrollment.id ? currentEnrollment : enrollment
      );
      
      setEnrollments(updatedEnrollments);
      toast.success('Enrollment updated successfully');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to update enrollment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        setLoading(true);
        await api.delete(`/admin/course-enrollments/${id}`);
        setEnrollments(enrollments.filter(enrollment => enrollment.id !== id));
        toast.success('Enrollment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete enrollment');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setCurrentEnrollment({
      id: null,
      userId: '',
      courseId: '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'ENROLLED',
    });
  };

  const openEditModal = (enrollment) => {
    setCurrentEnrollment({
      ...enrollment,
      enrollmentDate: new Date(enrollment.enrollmentDate).toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ENROLLED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'DROPPED': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterEnrollments = () => {
    return enrollments.filter(enrollment => {
      const matchesCourse = courseFilter ? enrollment.courseId.toString() === courseFilter : true;
      const matchesUser = userFilter ? enrollment.userId.toString() === userFilter : true;
      const matchesStatus = statusFilter ? enrollment.status === statusFilter : true;
      return matchesCourse && matchesUser && matchesStatus;
    });
  };

  const filteredEnrollments = filterEnrollments();

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Enrollment Management</h1>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Enrollment
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-medium mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username || user.email}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              className="w-full border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button 
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
            onClick={() => {
              setCourseFilter('');
              setUserFilter('');
              setStatusFilter('');
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Enrollments Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-5 text-center">
          <p className="text-gray-500">No enrollments found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Course</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Enrollment Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEnrollments.map((enrollment) => {
                const user = users.find(u => u.id === enrollment.userId) || { username: 'Unknown' };
                const course = courses.find(c => c.id === enrollment.courseId) || { title: 'Unknown' };
                
                return (
                  <tr key={enrollment.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.username || user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{course.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => openEditModal(enrollment)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteEnrollment(enrollment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Add Enrollment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Enrollment</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.userId}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    userId: e.target.value
                  })}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username || user.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.courseId}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    courseId: e.target.value
                  })}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.enrollmentDate}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    enrollmentDate: e.target.value
                  })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.status}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    status: e.target.value
                  })}
                  required
                >
                  <option value="ENROLLED">Enrolled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleCreateEnrollment}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Enrollment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Enrollment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Enrollment</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.userId}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    userId: e.target.value
                  })}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username || user.email}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.courseId}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    courseId: e.target.value
                  })}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.enrollmentDate}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    enrollmentDate: e.target.value
                  })}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={currentEnrollment.status}
                  onChange={(e) => setCurrentEnrollment({
                    ...currentEnrollment,
                    status: e.target.value
                  })}
                  required
                >
                  <option value="ENROLLED">Enrolled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={handleUpdateEnrollment}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Enrollment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseEnrollmentManage;