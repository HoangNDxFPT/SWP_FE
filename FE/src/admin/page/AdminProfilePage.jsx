import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
                        fullName: response.data.fullName || '',
                        phoneNumber: response.data.phoneNumber || '',
                        address: response.data.address || '',
                        dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
                        gender: response.data.gender || ''
                    });
                } else {
                    throw new Error('Could not fetch profile information.');
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
    };

    const handleSave = async () => {
        try {
            const response = await api.put('profile', user);
            if (response.status === 200) {
                setEditMode(false);
                setUser(response.data);
                toast.success('Profile updated successfully!');
            } else {
                toast.error('Failed to update profile!');
            }
        } catch (err) {
            toast.error('Failed to update profile!');
            console.error('Error updating profile:', err);
        }
    };

    // Handle password change
    const handlePwInput = e => {
        setPwForm({ ...pwForm, [e.target.name]: e.target.value });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            toast.error('Please fill in all fields!');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters!');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('Password confirmation does not match!');
            return;
        }
        setChangePwLoading(true);
        try {
            await api.post('/change-password', {
                oldPassword: pwForm.oldPassword,
                newPassword: pwForm.newPassword
            });
            toast.success('Password changed successfully!');
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Old password is incorrect!');
            } else {
                const msg = err.response?.data?.message || err.message || 'Failed to change password!';
                toast.error(msg);
            }
        }
        setChangePwLoading(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading profile information...</p></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500"><p>Could not load profile: {error.message}. Please try again later.</p></div>;
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={2000} />
            <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-10 mb-10">
                <div className="flex border-b mb-8">
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Personal Information
                    </button>
                    <button
                        className={`flex-1 py-2 font-semibold ${activeTab === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Change Password
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
                        <label className="font-semibold">Old Password</label>
                        <input
                            type="password"
                            name="oldPassword"
                            value={pwForm.oldPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={pwForm.newPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <label className="font-semibold">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={pwForm.confirmPassword}
                            onChange={handlePwInput}
                            className="p-2 border rounded bg-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            required
                        />

                        <a href="/forgot-password"
                            className="text-blue-600 hover:underline font-semibold">Forgot password?</a>
                        <button
                            type="submit"
                            disabled={changePwLoading}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors duration-200 mt-4"
                        >
                            {changePwLoading ? 'Changing password...' : 'Change Password'}
                        </button>
                    </form>
                )}
            </div>
        </>
    );
}

export default AdminProfilePage;