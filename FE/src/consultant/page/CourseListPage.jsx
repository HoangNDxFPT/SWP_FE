import React, { useEffect, useState } from "react";
import { Card, Spin, Input, Tag } from "antd";
import api from "../../config/axios";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/courses/list")
      .then((res) => setCourses(res.data.filter((c) => !c.deleted)))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
    <ConsultantHeader />
    <div className="bg-gradient-to-tr from-blue-50 to-blue-200 min-h-screen py-10">
        
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-800">Danh sách khoá học</h1>
        <Input.Search
          placeholder="Tìm kiếm khoá học..."
          allowClear
          className="mb-6"
          size="large"
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
            {filteredCourses.map(c => (
              <Card
                key={c.id}
                title={<span className="font-semibold text-blue-700">{c.name}</span>}
                className="rounded-xl shadow transition hover:shadow-lg"
                bordered={false}
                extra={<Tag color="blue">{c.targetAgeGroup}</Tag>}
              >
                <div className="mb-2 text-gray-700">{c.description}</div>
                <div className="text-sm text-gray-500">
                  Từ: {c.startDate} - Đến: {c.endDate}
                </div>
                {c.url && (
                  <div className="mt-3">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Xem chi tiết
                    </a>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
        
    </div>
    <Footer />
    </>
  );
}
