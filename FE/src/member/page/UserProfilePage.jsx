// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserProfilePage() {
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
                        userId: response.data.userId,
                        fullName: response.data.fullName || '',
                        phoneNumber: response.data.phoneNumber || '',
                        address: response.data.address || '',
                        dateOfBirth: response.data.dateOfBirth
                            ? new Date(response.data.dateOfBirth).toISOString().split('T')[0]
                            : '',
                        gender: response.data.gender || ''
                    });
                } else {
                    throw new Error('Không thể lấy thông tin hồ sơ.');
                }
            } catch (err) {
                setError(err);
                toast.error('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
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
            // Đảm bảo có đầy đủ các trường cần thiết, đặc biệt là userId
            const updateData = {
                ...user,
                userId: user.userId || parseInt(localStorage.getItem('userId'))
            };

            // Đảm bảo dateOfBirth đúng định dạng YYYY-MM-DD
            if (updateData.dateOfBirth) {
                const dateObj = new Date(updateData.dateOfBirth);
                if (!isNaN(dateObj.getTime())) {
                    updateData.dateOfBirth = dateObj.toISOString().split('T')[0];
                }
            }

            const response = await api.patch('profile/update-self', updateData);

            if (response.status === 200) {
                setEditMode(false);
                toast.success('Hồ sơ đã được cập nhật thành công!');
                
                // Cập nhật localStorage để cập nhật header
                localStorage.setItem('fullName', updateData.fullName || '');
                
                // Cố gắng cập nhật userInfo trong localStorage nếu có
                try {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    userInfo.fullName = updateData.fullName || '';
                    localStorage.setItem('userInfo', JSON.stringify(userInfo));
                } catch (e) {
                    console.error('Error updating localStorage:', e);
                }

                // Lấy lại thông tin mới nhất
                const updatedProfile = await api.get('profile');
                if (updatedProfile.status === 200 && updatedProfile.data) {
                    setUser({
                        userId: updatedProfile.data.userId,
                        fullName: updatedProfile.data.fullName || '',
                        phoneNumber: updatedProfile.data.phoneNumber || '',
                        address: updatedProfile.data.address || '',
                        dateOfBirth: updatedProfile.data.dateOfBirth
                            ? new Date(updatedProfile.data.dateOfBirth).toISOString().split('T')[0]
                            : '',
                        gender: updatedProfile.data.gender || ''
                    });
                }
            }
        } catch (err) {
            console.error('Error updating profile:', err);

            if (err.response) {
                if (err.response.data && typeof err.response.data === 'string') {
                    toast.error(`Lỗi: ${err.response.data}`);
                } else if (err.response.data && err.response.data.message) {
                    toast.error(`Lỗi: ${err.response.data.message}`);
                } else {
                    toast.error(`Lỗi: ${err.response.status} - ${err.response.statusText}`);
                }
            } else {
                toast.error('Cập nhật hồ sơ thất bại! Vui lòng thử lại sau.');
            }
        }
    };

    // Xử lý đổi mật khẩu
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            toast.warning('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp!');
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
                toast.error('Mật khẩu cũ không đúng!');
            } else {
                const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại!';
                toast.error(msg);
            }
        }
        setChangePwLoading(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Đang tải thông tin hồ sơ...</p></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500"><p>Không thể tải hồ sơ: {error.message}. Vui lòng thử lại sau.</p></div>;
    }

    return (
        <>
            <Header />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
            <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-10 mb-10">
                <div className="flex border-b mb-8">
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi mật khẩu
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
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Số Điện Thoại</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={user.phoneNumber}
                            onChange={handleChange}
                            disabled
                            className="p-2 border rounded bg-gray-200 cursor-not-allowed"
                        />

                        <label className="font-semibold">Địa Chỉ</label>
                        <input
                            type="text"
                            name="address"
                            value={user.address}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Ngày Sinh</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={user.dateOfBirth}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Giới Tính</label>
                        <select
                            name="gender"
                            value={user.gender}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Chọn</option>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                            <option value="OTHER">Khác</option>
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
                        <label className="font-semibold">Mật khẩu cũ</label>
                        <input
                            type="password"
                            name="oldPassword"
                            value={pwForm.oldPassword}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                        {/* Hiển thị lỗi ngay dưới ô mật khẩu cũ nếu có lỗi 401 */}
                        {/* {pwMsg === 'Mật khẩu cũ không đúng!' && (
                            <div className="text-red-600 text-sm -mt-2 mb-2">{pwMsg}</div>
                        )} */}

                        <label className="font-semibold">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={pwForm.newPassword}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={pwForm.confirmPassword}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <a href="/forgot-password"
                            className="text-blue-600 hover:underline font-semibold">Quên mật khẩu?</a>
                        <button
                            type="submit"
                            disabled={changePwLoading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 mt-4"
                        >
                            {changePwLoading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                        </button>


                    </form>
                )}
            </div>
        </>
    );
}

export default UserProfilePage;