import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
import { FaUser, FaLock, FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';

function AdminProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [pwForm, setPwForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('profile');
                if (response.status === 200 && response.data) {
                    setUser({
                        id: response.data.userId,
                        fullName: response.data.fullName || '',
                        phoneNumber: response.data.phoneNumber || '',
                        address: response.data.address || '',
                        dateOfBirth: response.data.dateOfBirth ? 
                          new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
                        gender: response.data.gender || ''
                    });
                } else {
                    throw new Error('Không thể tải thông tin hồ sơ.');
                }
            } catch (err) {
                setError(err);
                toast.error('Tải hồ sơ thất bại: ' + (err.response?.data?.message || err.message));
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleChange = e => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const profilePayload = {
                userId: user.id, 
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                address: user.address,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender
            };
           
            const response = await api.patch('/profile/update-self', profilePayload);
            
            if (response.status === 200) {
                setEditMode(false);
                toast.success('Cập nhật hồ sơ thành công!');
            } else {
                toast.error('Cập nhật hồ sơ thất bại!');
            }
        } catch (err) {
            toast.error('Cập nhật hồ sơ thất bại: ' + (err.response?.data?.message || err.message));
            console.error('Error updating profile:', err);
        }
    };

    // Handle password change
    const handlePwInput = e => {
        setPwForm({ ...pwForm, [e.target.name]: e.target.value });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        // Validation with toast notifications
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            toast.warning('Vui lòng điền đầy đủ tất cả các trường mật khẩu');
            return;
        }
        
        if (pwForm.newPassword.length < 6) {
            toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('Xác nhận mật khẩu không khớp');
            return;
        }
        
        setChangePwLoading(true);
        try {
            await api.post('/change-password', {
                oldPassword: pwForm.oldPassword,
                newPassword: pwForm.newPassword
            });
            toast.success('Đổi mật khẩu thành công!');
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Mật khẩu cũ không đúng');
            } else {
                const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại';
                toast.error(msg);
            }
            console.error('Error changing password:', err);
        }
        setChangePwLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Đang tải hồ sơ</h3>
                        <p className="text-gray-500 text-center">Vui lòng chờ trong giây lát...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                        <p className="text-gray-600 mb-4">Không thể tải hồ sơ: {error.message}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            {/* Toast Container Configuration */}
            <ToastContainer 
                position="top-right" 
                autoClose={3000} 
                hideProgressBar={false}
                newestOnTop 
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                className="mt-16"
            />
            
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <div className="flex items-center">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                                <FaUser className="text-2xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Hồ Sơ Quản Trị Viên</h1>
                                <p className="text-blue-100 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200">
                        <button
                            className={`flex-1 py-4 px-6 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                                activeTab === 'profile' 
                                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <FaUser className="text-sm" />
                            Thông Tin Cá Nhân
                        </button>
                        <button
                            className={`flex-1 py-4 px-6 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${
                                activeTab === 'password' 
                                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' 
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                            onClick={() => setActiveTab('password')}
                        >
                            <FaLock className="text-sm" />
                            Đổi Mật Khẩu
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="bg-white rounded-xl shadow-lg p-8">{activeTab === 'profile' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Họ và Tên</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={user.fullName}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
                                        !editMode 
                                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                                            : 'bg-white border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    }`}
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Số Điện Thoại</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={user.phoneNumber}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
                                        !editMode 
                                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                                            : 'bg-white border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    }`}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700">Địa Chỉ</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={user.address}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
                                        !editMode 
                                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                                            : 'bg-white border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    }`}
                                    placeholder="Nhập địa chỉ"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Ngày Sinh</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={user.dateOfBirth || ''}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
                                        !editMode 
                                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                                            : 'bg-white border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    }`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Giới Tính</label>
                                <select
                                    name="gender"
                                    value={user.gender || ''}
                                    onChange={handleChange}
                                    disabled={!editMode}
                                    className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
                                        !editMode 
                                            ? 'bg-gray-50 border-gray-200 text-gray-600' 
                                            : 'bg-white border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                    }`}
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex gap-4 justify-center">
                                {editMode ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
                                        >
                                            <FaSave />
                                            Lưu Thay Đổi
                                        </button>
                                        <button
                                            onClick={() => setEditMode(false)}
                                            className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2 shadow-md"
                                        >
                                            <FaTimes />
                                            Hủy
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
                                    >
                                        <FaEdit />
                                        Chỉnh Sửa Hồ Sơ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'password' && (
                    <form className="space-y-6" onSubmit={handleChangePassword}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Mật Khẩu Cũ</label>
                                <input
                                    type="password"
                                    name="oldPassword"
                                    value={pwForm.oldPassword}
                                    onChange={handlePwInput}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Mật Khẩu Mới</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={pwForm.newPassword}
                                    onChange={handlePwInput}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Xác Nhận Mật Khẩu Mới</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={pwForm.confirmPassword}
                                    onChange={handlePwInput}
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                                <Link
                                    to="/forgot-password"
                                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
                                >
                                    Quên mật khẩu?
                                </Link>
                                
                                <button
                                    type="submit"
                                    disabled={changePwLoading}
                                    className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md ${
                                        changePwLoading 
                                            ? 'bg-blue-400 text-white cursor-not-allowed' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {changePwLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Đang đổi mật khẩu...
                                        </>
                                    ) : (
                                        <>
                                            <FaLock />
                                            Đổi Mật Khẩu
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
                </div>
            </div>
        </div>
    );
}

export default AdminProfilePage;