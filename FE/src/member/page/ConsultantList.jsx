import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';

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
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch consultants
  useEffect(() => {
    const fetchConsultants = async () => {
      try {
        const res = await api.get('consultant/consultants');
        if (res.status === 200) {
          setConsultants(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch consultants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, []);

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await api.get('consultant/schedules');
        if (res.status === 200) {
          setSchedules(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      }
    };
    fetchSchedules();
  }, []);

  const formatTimeSlot = (timeStr) => timeStr?.substring(0, 5);

  const filteredConsultants = consultants.filter(c => {
    const matchName = c.fullName?.toLowerCase().includes(search.toLowerCase());
    if (!date || !time) return matchName;

    const matchedSlot = schedules.find(s =>
      String(s.consultantId) === String(c.id) &&
      s.workDate === date &&
      formatTimeSlot(s.startTime) === time
    );

    return matchName && matchedSlot?.isAvailable;
  });

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto py-10">
        {/* Filters */}
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

        {/* Consultant Cards */}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredConsultants.length === 0 ? (
              <div className="col-span-4 text-center text-gray-500">No consultants found.</div>
            ) : (
              filteredConsultants.map(consultant => (
                <div key={consultant.id} className="border rounded-lg p-5 shadow hover:shadow-lg transition flex flex-col">
                  <div className="font-semibold text-lg mb-1">{consultant.fullName}</div>
                  <div className="text-gray-600 mb-1">{consultant.email}</div>
                  <div className="text-gray-600 mb-1">{consultant.phone}</div>
                  <a
                    href={`/consultant/${consultant.id}`}
                    className="mt-auto inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition"
                  >
                    Xem hồ sơ
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ConsultantList;
