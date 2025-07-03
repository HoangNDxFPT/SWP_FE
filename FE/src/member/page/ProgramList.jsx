import React, { useEffect, useState } from 'react';
import api from '../../config/axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function ProgramList() {
    const [programs, setPrograms] = useState([]);
    const [historyPrograms, setHistoryPrograms] = useState([]);
    const [activeTab, setActiveTab] = useState('available');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const [resAll, resHistory] = await Promise.all([
                    api.get('/programs', { headers: { Authorization: `Bearer ${token}` } }),
                    api.get('/programs/my-history', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (resAll.status === 200 && resHistory.status === 200) {
                    setPrograms(resAll.data);
                    setHistoryPrograms(resHistory.data);
                } else {
                    toast.error('Không thể tải dữ liệu chương trình');
                }
            } catch (error) {
                console.error('Fetch programs error:', error);
                toast.error('Lỗi khi tải dữ liệu chương trình');
            } finally {
                setLoading(false);
            }
        };

        fetchPrograms();
    }, []);

    const handleEnrollAndNavigate = async (programId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Vui lòng đăng nhập để tham gia chương trình.');
                return;
            }

            const res = await api.post(`/programs/${programId}`, null, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200) {
                toast.success('Tham gia chương trình thành công!');
                navigate('/welcome-program');
            } else {
                toast.error('Tham gia chương trình thất bại.');
            }
        } catch (error) {
            console.error('Enroll error:', error);
            if (error.response && error.response.status === 400 && error.response.data === "User already registered") {
                toast.warn('Bạn đã đăng ký chương trình này rồi.');
            } else {
                toast.error('Đã xảy ra lỗi khi tham gia chương trình.');
            }
        }
    };

    const filteredPrograms = programs.filter(program =>
        program.name.toLowerCase().includes(search.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(search.toLowerCase())) ||
        program.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-5xl mx-auto py-10 px-4">
                <h1 className="text-3xl font-bold text-blue-800 mb-6">Chương trình cộng đồng</h1>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6">
                    <button
                        className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'available' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setActiveTab('available')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg font-semibold ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Đã tham gia
                    </button>
                </div>

                {/* Search bar */}
                {activeTab === 'available' && (
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, mô tả hoặc địa điểm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : activeTab === 'available' ? (
                    <div className="space-y-8">
                        {filteredPrograms.map(program => (
                            <div key={program.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                                <h2 className="text-xl font-bold text-blue-700 mb-2">{program.name}</h2>
                                <p className="text-gray-700 mb-3">{program.description}</p>

                                <p className="text-sm text-gray-600 mb-1">
                                    <b>Thời gian:</b> {new Date(program.start_date).toLocaleDateString('vi-VN')} - {new Date(program.end_date).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <b>Địa điểm:</b> {program.location}
                                </p>

                                <div className="mt-2">
                                    <iframe
                                        title={`Map of ${program.location}`}
                                        width="100%"
                                        height="200"
                                        loading="lazy"
                                        style={{ border: 0, borderRadius: '8px' }}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(program.location)}&output=embed`}
                                    ></iframe>
                                </div>

                                <button
                                    onClick={() => handleEnrollAndNavigate(program.id)}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-sm hover:shadow-md"
                                >
                                    Tham gia chương trình
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {historyPrograms.map(program => (
                            <div key={program.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                                <h2 className="text-xl font-bold text-green-700 mb-2">{program.name}</h2>
                                <p className="text-sm text-gray-600 mb-1">
                                    <b>Thời gian:</b> {new Date(program.start_date).toLocaleDateString('vi-VN')} - {new Date(program.end_date).toLocaleDateString('vi-VN')}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <b>Địa điểm:</b> {program.location}
                                </p>

                                <div className="mt-2">
                                    <iframe
                                        title={`Map of ${program.location}`}
                                        width="100%"
                                        height="200"
                                        loading="lazy"
                                        style={{ border: 0, borderRadius: '8px' }}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(program.location)}&output=embed`}
                                    ></iframe>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}

export default ProgramList;
