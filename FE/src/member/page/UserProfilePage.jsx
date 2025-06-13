// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';

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
    const [profileMsg, setProfileMsg] = useState('');
    const [pwMsg, setPwMsg] = useState('');
    const [pwMsgType, setPwMsgType] = useState(''); // 'success' | 'error'

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('profile');
                if (response.status === 200 && response.data) {
                    setUser({
                        fullName: response.data.fullName || '',
                        phoneNumber: response.data.phoneNumber || '',
                        address: response.data.address || '',
                        dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
                        gender: response.data.gender || ''
                    });
                } else {
                    throw new Error('Không thể lấy thông tin hồ sơ.');
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleChange = e => {
        setUser({ ...user, [e.target.name]: e.target.value });
        setProfileMsg('');
    };

    const handleSave = async () => {
        setProfileMsg('');
        try {
            const response = await api.patch('profile', user);
            if (response.status === 200) {
                setEditMode(false);
                setProfileMsg('Hồ sơ đã được cập nhật thành công!');
                setUser(response.data);
            } else {
                setProfileMsg('Cập nhật hồ sơ thất bại!');
            }
        } catch (err) {

            setProfileMsg('Cập nhật hồ sơ thất bại!');
            console.error('Error updating profile:', err);
        }
    };

    // Xử lý đổi mật khẩu
    const handlePwInput = e => {
        setPwForm({ ...pwForm, [e.target.name]: e.target.value });
        setPwMsg('');
        setPwMsgType('');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwMsg('');
        setPwMsgType('');
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            setPwMsg('Vui lòng nhập đầy đủ thông tin!');
            setPwMsgType('error');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwMsg('Mật khẩu mới phải có ít nhất 6 ký tự!');
            setPwMsgType('error');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg('Mật khẩu xác nhận không khớp!');
            setPwMsgType('error');
            return;
        }
        setChangePwLoading(true);
        try {
            await api.post('http://localhost:8080/api/change-password', {
                oldPassword: pwForm.oldPassword,
                newPassword: pwForm.newPassword
            });
            setPwMsg('Đổi mật khẩu thành công!');
            setPwMsgType('success');
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            if (err.response?.status === 401) {
                setPwMsg('Mật khẩu cũ không đúng!');
            } else {
                const msg = err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại!';
                setPwMsg(msg);
            }
            setPwMsgType('error');
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
                        <label className="font-semibold">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={user.fullName}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Phone Number</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={user.phoneNumber}
                            onChange={handleChange}
                            disabled
                            className="p-2 border rounded bg-gray-200 cursor-not-allowed"
                        />

                        <label className="font-semibold">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={user.address}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={user.dateOfBirth}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <label className="font-semibold">Gender</label>
                        <select
                            name="gender"
                            value={user.gender}
                            onChange={handleChange}
                            disabled={!editMode}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Select</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>

                        {profileMsg && (
                            <div className={`text-center mt-2 ${profileMsg.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
                                {profileMsg}
                            </div>
                        )}

                        <div className="flex gap-4 mt-6 justify-center">
                            {editMode ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="border border-gray-400 text-gray-700 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Edit Profile
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
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />
                        {/* Hiển thị lỗi ngay dưới ô mật khẩu cũ nếu có lỗi 401 */}
                        {pwMsg === 'Mật khẩu cũ không đúng!' && (
                            <div className="text-red-600 text-sm -mt-2 mb-2">{pwMsg}</div>
                        )}

                        <label className="font-semibold">Mật khẩu mới</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={pwForm.newPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={pwForm.confirmPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        {/* Hiển thị các lỗi khác hoặc thành công */}
                        {pwMsg && pwMsg !== 'Mật khẩu cũ không đúng!' && (
                            <div className={`text-center mt-2 ${pwMsgType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {pwMsg}
                            </div>
                        )}
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