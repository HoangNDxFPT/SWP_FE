import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CourseEnrollmentManage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filter mode: 'course' or 'user'
  const [filterMode, setFilterMode] = useState('course');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Fetch courses and users when component mounts
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchCourses(),
          fetchUsers()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        // Reset loading state after initial load
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Watch for changes in filter mode, selected course or selected user
  useEffect(() => {
    if (filterMode === 'course' && selectedCourseId) {
      fetchEnrollmentsByCourse(selectedCourseId);
    } else if (filterMode === 'user' && selectedUserId) {
      fetchEnrollmentsByUser(selectedUserId);
    } else {
      // Clear enrollments when no selection
      setEnrollments([]);
    }
  }, [filterMode, selectedCourseId, selectedUserId]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/list');
      setCourses(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách khóa học');
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/profile/all');
      // Chỉ lấy người dùng có role là MEMBER
      const memberUsers = response.data.filter(user => user.role === 'MEMBER');
      setUsers(memberUsers);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
      console.error(error);
    }
  };

  const fetchEnrollmentsByCourse = async (courseId) => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments/course/${courseId}`);
      setEnrollments(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách đăng ký khóa học');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentsByUser = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/enrollments/user/${userId}`);
      setEnrollments(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách đăng ký của người dùng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterEnrollments = () => {
    if (!statusFilter) return enrollments;
    return enrollments.filter(enrollment => enrollment.status === statusFilter);
  };

  const filteredEnrollments = filterEnrollments();
  
  // Calculate statistics
  const getStatusCount = (status) => {
    return enrollments.filter(e => e.status === status).length;
  };

  const formatStatus = (status) => {
    switch(status) {
      case 'InProgress': return 'Đang học';
      case 'Completed': return 'Đã hoàn thành';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
      <div className="container mx-auto px-4 py-6">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Quản lý đăng ký khóa học</h1>
        </div>
        
        {/* Filter options */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-medium mb-4">Bộ lọc</h2>
          
          {/* Filter mode toggle */}
          <div className="flex gap-4 mb-4 border-b pb-4">
            <div 
              className={`cursor-pointer px-4 py-2 rounded-lg ${filterMode === 'course' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => {
                setFilterMode('course');
                setSelectedUserId('');
                setEnrollments([]);
              }}
            >
              Lọc theo khóa học
            </div>
            
            <div 
              className={`cursor-pointer px-4 py-2 rounded-lg ${filterMode === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => {
                setFilterMode('user');
                setSelectedCourseId('');
                setEnrollments([]);
              }}
            >
              Lọc theo người dùng
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterMode === 'course' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn khóa học</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">Chọn khóa học</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name || course.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn người dùng</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Chọn người dùng</option>
                  {users.map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.fullName || user.userName || user.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="InProgress">Đang học</option>
                <option value="Completed">Đã hoàn thành</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              onClick={() => {
                if (filterMode === 'course') {
                  setSelectedCourseId('');
                } else {
                  setSelectedUserId('');
                }
                setStatusFilter('');
                setEnrollments([]);
              }}
            >
              Đặt lại bộ lọc
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
        ) : (filterMode === 'course' && !selectedCourseId) || (filterMode === 'user' && !selectedUserId) ? (
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <p className="text-gray-500">
              Vui lòng chọn {filterMode === 'course' ? 'khóa học' : 'người dùng'} để xem danh sách đăng ký.
            </p>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <p className="text-gray-500">
              Không tìm thấy đăng ký nào {statusFilter && 'với trạng thái đã chọn'}.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Tên người dùng</th>
                  {/* <th className="px-6 py-3 text-left text-xs font-semibold text-white">ID khóa học</th> */}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Tên khóa học</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment, index) => (
                  <tr key={index} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.userName}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">{enrollment.courseId}</td> */}
                    <td className="px-6 py-4 whitespace-nowrap">{enrollment.courseName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(enrollment.status)}`}>
                        {formatStatus(enrollment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Statistics Section */}
        {enrollments.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-3">Thống kê</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-500">Tổng số đăng ký</div>
                <div className="text-xl font-semibold">{enrollments.length}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="text-sm text-gray-500">Đã hoàn thành</div>
                <div className="text-xl font-semibold">
                  {getStatusCount('Completed')}
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div className="text-sm text-gray-500">Đang học</div>
                <div className="text-xl font-semibold">
                  {getStatusCount('InProgress')}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="text-sm text-gray-500">Đã hủy</div>
                <div className="text-xl font-semibold">
                  {getStatusCount('Cancelled')}
                </div>
              </div>
            </div>
            
            {filterMode === 'user' && selectedUserId && enrollments.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-medium mb-2">Tiến độ học tập:</div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${Math.round((getStatusCount('Completed') / enrollments.length) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round((getStatusCount('Completed') / enrollments.length) * 100)}% khóa học đã hoàn thành
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
}

export default CourseEnrollmentManage;