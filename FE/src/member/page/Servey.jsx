import React, { useState } from 'react'
import Header from '../components/Header'

const questions = [
  "Câu 1: Bạn thích màu gì nhất?",
  "Câu 2: Bạn thường dậy lúc mấy giờ?",
  "Câu 3: Bạn thích ăn món nào nhất?",
  "Câu 4: Bạn thường đi làm bằng phương tiện gì?",
  "Câu 5: Bạn thích thể thao nào?",
  "Câu 6: Bạn thường giải trí bằng cách nào?",
  "Câu 7: Bạn thích mùa nào nhất?",
  "Câu 8: Bạn có nuôi thú cưng không?",
  "Câu 9: Bạn thích nghe thể loại nhạc nào?",
  "Câu 10: Bạn thường đi du lịch ở đâu?"
]

const options = [
  ["Đỏ", "Xanh", "Vàng", "Khác"],
  ["Trước 6h", "6-7h", "7-8h", "Sau 8h"],
  ["Phở", "Cơm", "Bún", "Khác"],
  ["Xe máy", "Ô tô", "Xe đạp", "Đi bộ"],
  ["Bóng đá", "Cầu lông", "Bơi", "Khác"],
  ["Xem phim", "Nghe nhạc", "Đọc sách", "Chơi game"],
  ["Xuân", "Hạ", "Thu", "Đông"],
  ["Có", "Không", "Đang cân nhắc", "Không quan tâm"],
  ["Pop", "Rock", "Nhạc trẻ", "Khác"],
  ["Trong nước", "Nước ngoài", "Không đi", "Chưa quyết định"]
]

function Servey() {
  const [answers, setAnswers] = useState(Array(10).fill(null))

  const handleChange = (qIdx, value) => {
    const newAnswers = [...answers]
    newAnswers[qIdx] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert("Bạn đã gửi khảo sát thành công!")
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 600, margin: "30px auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
        <h2 style={{ textAlign: "center" }}>Khảo sát nhanh</h2>
        <form onSubmit={handleSubmit}>
          {questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8, fontWeight: 500 }}>{q}</div>
              {options[idx].map((opt, oIdx) => (
                <label key={oIdx} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="radio"
                    name={`q${idx}`}
                    value={opt}
                    checked={answers[idx] === opt}
                    onChange={() => handleChange(idx, opt)}
                    required={idx === 0}
                  />{" "}
                  {opt}
                </label>
              ))}
            </div>
          ))}
          <button type="submit" style={{ padding: "8px 24px", borderRadius: 4, background: "#1976d2", color: "#fff", border: "none", fontWeight: 600 }}>
            Gửi khảo sát
          </button>
        </form>
      </div>
    </>
  )
}

export default Servey
