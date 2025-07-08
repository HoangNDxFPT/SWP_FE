import React, { useEffect, useState } from "react";
import { Modal, Spin, Tabs } from "antd";
import api from "../../config/axios";

export default function ConsultationCaseDetailModal({ open, onCancel, caseInfo }) {
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    if (open && caseInfo) {
      setLoading(true);
      // Giả sử caseInfo có userId, courseIds, programIds
      Promise.all([
        api.get(`/admin/assessment-answers?userId=${caseInfo.userId}`).catch(() => []),
        Promise.all((caseInfo.courseIds || []).map(id => api.get(`/courses/${id}`).then(res => res.data))),
        Promise.all((caseInfo.programIds || []).map(id => api.get(`/programs/${id}`).then(res => res.data))),
      ]).then(([surveysRes, coursesRes, programsRes]) => {
        setSurveys(Array.isArray(surveysRes.data) ? surveysRes.data : []);
        setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setPrograms(Array.isArray(programsRes) ? programsRes : []);
      }).finally(() => setLoading(false));
    }
  }, [open, caseInfo]);

  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={800} title="Chi tiết hồ sơ tư vấn">
      {loading ? (
        <Spin />
      ) : (
        <Tabs defaultActiveKey="surveys">
          <Tabs.TabPane tab="Khảo sát" key="surveys">
            <ul className="list-disc ml-4">
              {surveys.length === 0 ? (
                <li>Không có dữ liệu khảo sát.</li>
              ) : (
                surveys.map((s, idx) => (
                  <li key={s.id || idx}>
                    <b>Câu hỏi:</b> {s.question?.questionText} <br />
                    <b>Trả lời:</b> {s.answerText}
                  </li>
                ))
              )}
            </ul>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Khoá học" key="courses">
            <ul className="list-disc ml-4">
              {courses.length === 0 ? (
                <li>Không có khoá học đã học.</li>
              ) : (
                courses.map((c, idx) => (
                  <li key={c.id || idx}>
                    <b>{c.name}</b>: {c.description}
                  </li>
                ))
              )}
            </ul>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Chương trình cộng đồng" key="programs">
            <ul className="list-disc ml-4">
              {programs.length === 0 ? (
                <li>Không có chương trình cộng đồng đã tham gia.</li>
              ) : (
                programs.map((p, idx) => (
                  <li key={p.id || idx}>
                    <b>{p.name}</b>: {p.description}
                  </li>
                ))
              )}
            </ul>
          </Tabs.TabPane>
        </Tabs>
      )}
    </Modal>
  );
}
