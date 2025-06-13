import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [summary, setSummary] = useState([
    { label: "Tài khoản", value: 0 },
    { label: "Khóa học", value: 0 },
    { label: "Khảo sát", value: 0 },
    { label: "Lịch tư vấn", value: 0 },
  ]);

  useEffect(() => {
    fetch("/src/data/data.json")
      .then((res) => res.json())
      .then((data) => {
        setSummary([
          { label: "Tài khoản", value: data.Users?.length || 0 },
          { label: "Khóa học", value: data.Courses?.length || 0 },
          { label: "Khảo sát", value: data.CourseQuiz?.length || 0 },
          { label: "Lịch tư vấn", value: 0 }, // Nếu có trường lịch tư vấn thì thay thế
        ]);
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-blue-900">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {summary.map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center"
          >
            <div className="text-4xl font-bold text-blue-600 mb-2">{item.value}</div>
            <div className="text-gray-700 font-semibold">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <em className="text-gray-500">Thống kê sẽ hiển thị ở đây…</em>
      </div>
    </div>
  );
}