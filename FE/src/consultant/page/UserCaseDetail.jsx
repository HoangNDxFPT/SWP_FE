import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ConsultantHeader from '../components/Header';
import Footer from '../components/Footer';
import api from '../../config/axios';
import { toast } from 'react-toastify';

function UserCaseDetail() {
  const { id } = useParams();
  const [caseDetail, setCaseDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  // Chưa có API, dùng mock tạm
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const fake = {
        id, userId: 2, userName: 'Nguyễn Văn A', dateOfBirth: '2000-01-01', status: 'Đang tư vấn', note: 'Cần hỗ trợ thêm',
      };
      setCaseDetail(fake);
      setNote(fake.note);
      setLoading(false);

      // Khi backend có API, thay bằng:
      // api.get(`/consultant/cases/${id}`).then(res => {
      //   setCaseDetail(res.data);
      //   setNote(res.data.note || '');
      // });
    }, 500);
  }, [id]);

  // **Dùng API thật để lấy profile user**
  useEffect(() => {
    if (caseDetail?.userId) {
      api.get(`/profile/${caseDetail.userId}`)
        .then(res => setUserProfile(res.data))
        .catch(() => setUserProfile(null));
    }
  }, [caseDetail]);

  // Khi backend có API PATCH, thay đổi tương tự
  const handleSaveNote = () => {
    toast.success('Lưu ghi chú thành công (fake)');
    // Khi backend có API, thay bằng:
    // api.patch(`/consultant/cases/${id}/note`, { note }).then(...)
  };

  if (loading) return <div>Đang tải chi tiết hồ sơ...</div>;
  if (!caseDetail) return <div>Không tìm thấy hồ sơ.</div>;

  return (
    <>
      <ConsultantHeader />
      <div className="max-w-xl mx-auto py-10">
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Chi tiết hồ sơ tư vấn</h2>
        <div className="border rounded p-6 bg-white mb-4">
          <div><b>Tên người dùng:</b> {caseDetail.userName}</div>
          <div><b>Ngày sinh:</b> {caseDetail.dateOfBirth}</div>
          <div><b>Trạng thái:</b> {caseDetail.status}</div>
          {userProfile && (
            <div className="my-2 text-sm text-gray-600">
              <b>SĐT:</b> {userProfile.phoneNumber} | <b>Địa chỉ:</b> {userProfile.address}
            </div>
          )}
          <div className="mt-4">
            <label className="block font-semibold mb-2">Ghi chú tư vấn:</label>
            <textarea
              rows={4}
              className="w-full border rounded p-2"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2" onClick={handleSaveNote}>
              Lưu ghi chú
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default UserCaseDetail;
