import React, { useEffect, useState } from 'react';
import ConsultantHeader from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

function UserCaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chưa có API, dùng mock data tạm
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setCases([
        { id: 11, userId: 2, userName: 'Nguyễn Văn A', createdAt: '2025-06-05', status: 'Đang tư vấn' },
        { id: 12, userId: 3, userName: 'Trần Thị B', createdAt: '2025-06-10', status: 'Đã hoàn thành' },
      ]);
      setLoading(false);
    }, 500);
    // Khi backend có API, thay bằng:
    // api.get('/consultant/cases').then(res => {
    //   setCases(res.data);
    //   setLoading(false);
    // });
  }, []);

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-6xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Hồ sơ đang tư vấn</h2>
        {loading ? (
          <div>Đang tải hồ sơ...</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Tên người dùng</th>
                <th className="p-2">Ngày tạo</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6">Không có hồ sơ nào.</td>
                </tr>
              )}
              {cases.map(c => (
                <tr key={c.id}>
                  <td className="p-2">{c.userName}</td>
                  <td className="p-2">{c.createdAt}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">
                    <Link to={`/consultant/cases/${c.id}`}>
                      <button className="text-blue-500 underline">Xem</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
}

export default UserCaseList;
