// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from 'react';
import api from '../../config/axios'; // <-- Đây là nơi bạn import instance đã cấu hình
import { toast } from 'react-toastify';
import Header from '../components/Header';


function UserProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                // Gọi API '/profile' sử dụng 'api' instance
                // Token từ localStorage đã được tự động thêm vào header Authorization bởi interceptor
                const response = await api.get('profile'); // <-- Không cần truyền token thủ công!

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
                console.error('Lỗi khi lấy thông tin hồ sơ:', err);
                setError(err);
                // Lỗi đã được xử lý chung bởi interceptor trong api.js (ví dụ: thông báo toast)
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
            // Gọi API PATCH '/profile' sử dụng 'api' instance
            // Token cũng được tự động thêm vào đây
            const response = await api.patch('profile', user); // <-- Không cần truyền token thủ công!

            if (response.status === 200) {
                setEditMode(false);
                toast.success('Hồ sơ đã được cập nhật thành công!');
                setUser(response.data); // Cập nhật state với dữ liệu mới nhất từ backend
            } else {
                toast.error('Cập nhật hồ sơ thất bại!');
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật hồ sơ:', err);
            // Lỗi đã được xử lý chung bởi interceptor trong api.js
        }
    };

    // ... (Phần render UI của bạn không thay đổi) ...
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
            <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">User Profile</h2>
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
        </div>
        </>
    );
}

export default UserProfilePage;