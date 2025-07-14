import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';

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
                // Thêm dấu / ở đầu URL 
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
            // Tạo payload phù hợp với ProfileDTO
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
            // Sửa URL API - thêm /api/ phía trước
            await api.post('/change-password', {
                oldPassword: pwForm.oldPassword,
                newPassword: pwForm.newPassword
            });
            
            // Hiển thị thông báo thành công
            toast.success('Đổi mật khẩu thành công!');
            
            // Reset form sau khi đổi mật khẩu thành công
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            
        } catch (err) {
            // Hiển thị thông báo lỗi cụ thể
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-3">Đang tải hồ sơ ......</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-xl w-full">
                    <p className="font-bold">Lỗi</p>
                    <p>Không thể tải hồ sơ: {error.message}. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Cấu hình ToastContainer để hiển thị thông báo đẹp hơn */}
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
            />
            
            <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-10 mb-10">
                <h2 className="text-2xl font-bold mb-6 text-center">Hồ Sơ Quản Trị Viên</h2>
                
                <div className="flex border-b mb-8">
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Thông Tin Cá Nhân
                    </button>
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi Mật Khẩu
                    </button>
                </div>

                {activeTab === 'profile' && (
                    <div className="flex flex-col gap-4">
                        <label className="font-semibold">Họ và Tên</label>
                        <input
                            type="text"
                            name="fullName"
                            value={user.fullName}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        />

                        <label className="font-semibold">Số Điện Thoại</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={user.phoneNumber}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        />

                        <label className="font-semibold">Địa Chỉ</label>
                        <input
                            type="text"
                            name="address"
                            value={user.address}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        />

                        <label className="font-semibold">Ngày Sinh</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={user.dateOfBirth || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        />

                        <label className="font-semibold">Giới Tính</label>
                        <select
                            name="gender"
                            value={user.gender || ''}
                            onChange={handleChange}
                            disabled={!editMode}
                            className={`p-2 border rounded ${!editMode ? 'bg-gray-100' : 'bg-white'} focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                        >
                            <option value="">Chọn</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                        </select>

                        <div className="flex gap-4 mt-6 justify-center">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        Lưu
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        Hủy
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Chỉnh Sửa Hồ Sơ
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'password' && (
                    <form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
                        <label className="font-semibold">Mật Khẩu Cũ</label>
                        <input
                            type="password"
                            name="oldPassword"
                            value={pwForm.oldPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">Mật Khẩu Mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={pwForm.newPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">Xác Nhận Mật Khẩu Mới</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={pwForm.confirmPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <Link
                            to="/forgot-password"
                            className="text-blue-600 hover:underline font-semibold"
                        >
                            Quên mật khẩu?
                        </Link>
                        <button
                            type="submit"
                            disabled={changePwLoading}
                            className={`${changePwLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-md font-semibold transition-colors duration-200 mt-4`}
                        >
                            {changePwLoading ? (
                                <>
                                    <span className="inline-block animate-spin mr-2">⟳</span> 
                                    Đang đổi mật khẩu...
                                </>
                            ) : 'Đổi Mật Khẩu'}
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

export default AdminProfilePage;