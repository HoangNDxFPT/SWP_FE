import React, { useState } from 'react';
import { Input } from 'antd';

function ConsultationCaseTable({ cases, loading }) {
  const [search, setSearch] = useState('');
  const filteredCases = cases.filter(c =>
    c.userName?.toLowerCase().includes(search.toLowerCase())
    // Thêm filter khác nếu muốn
  );
  return (
    <>
      <div className="mb-4">
        <Input.Search
          placeholder="Tìm tên người dùng..."
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
      </div>
      <div className="overflow-x-auto rounded-xl shadow">
        <table className="w-full bg-white">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-2">Tên người dùng</th>
              <th className="p-2">Ngày tạo</th>
              <th className="p-2">Trạng thái</th>
              <th className="p-2">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Đang tải...</td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8">Không có hồ sơ nào.</td>
              </tr>
            ) : (
              filteredCases.map(c => (
                <tr key={c.id} className="transition hover:bg-blue-50">
                  <td className="p-2">{c.userName}</td>
                  <td className="p-2">{c.createdAt}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">
                    <span className="text-blue-500 underline cursor-pointer">Xem</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
export default ConsultationCaseTable;
