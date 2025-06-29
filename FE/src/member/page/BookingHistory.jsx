import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my-booking');
        setBookings(res.data);
      } catch (err) {
        console.error('Lỗi khi load booking history:', err);
        toast.error('Không thể tải lịch sử đặt lịch!');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Lịch sử đặt lịch tư vấn</h1>

        {loading ? (
          <p>Đang tải...</p>
        ) : bookings.length === 0 ? (
          <p>Chưa có lịch đặt nào.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 border rounded-lg bg-white shadow-sm"
              >
                <p>
                  <strong>Thời gian:</strong>{' '}
                  {new Date(booking.appointmentTime).toLocaleString('vi-VN')}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{' '}
                  <span
                    className={`font-semibold ${
                      booking.status === 'PENDING'
                        ? 'text-yellow-500'
                        : booking.status === 'CONFIRMED'
                        ? 'text-green-500'
                        : booking.status === 'CANCELLED'
                        ? 'text-red-500'
                        : ''
                    }`}
                  >
                    {booking.status}
                  </span>
                </p>
                <p>
                  <strong>Tư vấn viên:</strong> {booking.consultantFullName} (
                  {booking.consultantEmail})
                </p>
                <p>
                  <strong>Ghi chú:</strong> {booking.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default BookingHistory;
