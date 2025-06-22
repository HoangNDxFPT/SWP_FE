import React, { useState } from "react";
import { Modal, Select, Input, message } from "antd";

const suggestionTemplates = [
  "Bạn nên tham gia chương trình tư vấn nhóm.",
  "Đề nghị tham gia lớp kỹ năng sống.",
  "Gặp chuyên gia tâm lý trực tiếp.",
  "Đăng ký tư vấn 1:1 với chuyên viên.",
];

function SuggestionModal({ open, onCancel, appointment, onSend }) {
  const [suggestion, setSuggestion] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const handleOk = () => {
    console.log("Gửi đề xuất cho appointment:", appointment);
    if (!appointment?.userId) {
      message.error("Không xác định được khách hàng!");
      console.error("Không có userId trong appointment:", appointment);
      return;
    }
    console.log("userId gửi API:", appointment.userId, "suggestion:", suggestion);
    onSend(appointment.userId, suggestion);
  };

  return (
    <Modal
      title="Gửi đề xuất tư vấn"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Gửi đề xuất"
    >
      <div className="mb-2">
        <Select
          placeholder="Chọn mẫu đề xuất"
          value={selectedTemplate}
          onChange={(value) => {
            setSelectedTemplate(value);
            setSuggestion(value);
          }}
          style={{ width: "100%" }}
        >
          {suggestionTemplates.map((tpl, idx) => (
            <Select.Option value={tpl} key={idx}>
              {tpl}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Input.TextArea
        rows={4}
        value={suggestion}
        onChange={(e) => setSuggestion(e.target.value)}
        placeholder="Nhập nội dung đề xuất"
      />
    </Modal>
  );
}
export default SuggestionModal;
