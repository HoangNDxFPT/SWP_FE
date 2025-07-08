import React, { useEffect, useState } from "react";
import { Card, Spin, Input, Tag } from "antd";
import api from "../../config/axios";
import ConsultantHeader from "../components/Header";
import Footer from "../components/Footer";

export default function ProgramListPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get("/programs")
      .then((res) => setPrograms(res.data.filter((p) => !p.deleted)))
      .finally(() => setLoading(false));
  }, []);

  const filteredPrograms = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <ConsultantHeader />
      <div className="bg-gradient-to-tr from-blue-50 to-blue-200 min-h-screen py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-blue-800">Chương trình cộng đồng</h1>
        <Input.Search
          placeholder="Tìm kiếm chương trình..."
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
            {filteredPrograms.map(p => (
              <Card
                key={p.id}
                title={<span className="font-semibold text-blue-700">{p.name}</span>}
                className="rounded-xl shadow transition hover:shadow-lg"
                bordered={false}
                extra={<Tag color="blue">{p.location}</Tag>}
              >
                <div className="mb-2 text-gray-700">{p.description}</div>
                <div className="text-sm text-gray-500">
                  Từ: {p.start_date} - Đến: {p.end_date}
                </div>
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
