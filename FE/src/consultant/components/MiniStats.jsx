import React from 'react';
function MiniStats({ stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
      <div className="rounded-xl bg-blue-100 text-blue-700 p-4 text-center font-bold shadow">
        📅 <div className="text-2xl">{stats.total}</div> Tổng lịch hẹn
      </div>
      <div className="rounded-xl bg-yellow-100 text-yellow-700 p-4 text-center font-bold shadow">
        ⏳ <div className="text-2xl">{stats.pending}</div> Chờ xác nhận
      </div>
      <div className="rounded-xl bg-green-100 text-green-700 p-4 text-center font-bold shadow">
        ✅ <div className="text-2xl">{stats.confirmed}</div> Đã xác nhận
      </div>
      <div className="rounded-xl bg-indigo-100 text-indigo-700 p-4 text-center font-bold shadow">
        🎉 <div className="text-2xl">{stats.completed}</div> Hoàn thành
      </div>
      <div className="rounded-xl bg-red-100 text-red-700 p-4 text-center font-bold shadow">
        ❌ <div className="text-2xl">{stats.rejected}</div> Bị từ chối
      </div>
    </div>
  );
}
export default MiniStats;
