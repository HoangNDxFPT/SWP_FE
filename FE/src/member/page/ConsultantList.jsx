import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TIME_OPTIONS = [
    { value: '07:00', label: '07:00 - 07:45' },
    { value: '08:00', label: '08:00 - 08:45' },
    { value: '09:00', label: '09:00 - 09:45' },
    { value: '10:00', label: '10:00 - 10:45' },
    { value: '11:00', label: '11:00 - 11:45' },
    { value: '14:00', label: '14:00 - 14:45' },
    { value: '15:00', label: '15:00 - 15:45' },
    { value: '16:00', label: '16:00 - 16:45' },
];

function ConsultantList() {
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/Users')
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(u => u.role_id === 4 || u.role === 'CONSULTANT' || u.role === 'Consultant');
                setConsultants(filtered);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        // Lấy dữ liệu lịch tư vấn (ConsultantSchedule)
        fetch('http://localhost:5000/ConsultantSchedule')
            .then(res => res.json())
            .then(data => setSchedules(data))
            .catch(() => setSchedules([]));
    }, []);

    // Lọc theo tên, ngày, giờ và trạng thái available
    const filteredConsultants = consultants.filter(c => {
        const matchName = c.full_name?.toLowerCase().includes(search.toLowerCase());
        if (!date || !time) return matchName;
        // Kiểm tra lịch đã được book chưa
        const schedule = schedules.find(
            s => String(s.consultant_id) === String(c.id) && s.work_date === date && s.start_time === time
        );
        // Nếu chưa có lịch hoặc lịch còn available thì cho phép chọn
        return matchName && (!schedule || schedule.is_available);
    });

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <>
        <Header />
        <div className="max-w-7xl mx-auto py-10">
            {/* Thanh filter */}
            <div className="flex flex-wrap items-center gap-4 mb-8 px-2">
                <input
                    type="text"
                    placeholder="Tìm kiếm tên tư vấn viên..."
                    className="border rounded px-4 py-2 w-60"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <input
                    type="date"
                    className="border rounded px-4 py-2"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
                <select
                    className="border rounded px-4 py-2"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                >
                    <option value="">Chọn khung giờ</option>
                    {TIME_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                
            </div>
            {/* Danh sách consultant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredConsultants.length === 0 && (
                    <div className="col-span-4 text-center text-gray-500">No consultants found.</div>
                )}
                {filteredConsultants.map(consultant => (
                    <div key={consultant.id} className="border rounded-lg p-5 shadow hover:shadow-lg transition flex flex-col">
                        <div className="font-semibold text-lg mb-1">{consultant.full_name}</div>
                        <div className="text-gray-600 mb-1">{consultant.email}</div>
                        <div className="text-gray-500 text-sm mb-2">
                            {consultant.gender === 'MALE' || consultant.gender === 'M' ? 'Male' : 'Female'} | {consultant.date_of_birth}
                        </div>
                        <div className="text-gray-700 mb-2">{consultant.address}</div>
                        <a
                            href={`/consultant/${consultant.id}`}
                            className="mt-auto inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                        >
                            Xem hồ sơ
                        </a>
                    </div>
                ))}
            </div>
        </div>
        <Footer />
        </>
    );
}

export default ConsultantList;
