import React from "react";
import { Button } from "antd";

export default function ConsultationCaseTable({ cases, loading, onDetail }) {
  return (
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
          ) : cases.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8">Không có hồ sơ nào.</td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr key={c.id}>
                <td className="p-2">{c.userName}</td>
                <td className="p-2">{c.createdAt}</td>
                <td className="p-2">{c.status}</td>
                <td className="p-2">
                  <Button size="small" onClick={() => onDetail(c)}>
                    Xem
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
