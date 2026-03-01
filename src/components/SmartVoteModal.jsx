import React, { useState } from "react";
import { STYLES, COLORS } from "../utils/theme";
import { QUESTIONS } from "../utils/questions";

const SmartVoteModal = ({ candidates, onClose, onAutoVote }) => {
  const [userAnswers, setUserAnswers] = useState([0, 0, 0]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = parseInt(value, 10);
    setUserAnswers(newAnswers);
  };

  const calculateBestMatch = () => {
    let bestCandidate = null;
    let maxScore = -1;

    candidates.forEach((candidate) => {
      let score = 0;
      candidate.answers.forEach((ans, idx) => {
        if (ans === userAnswers[idx]) score++;
      });

      if (score > maxScore) {
        maxScore = score;
        bestCandidate = candidate;
      }
    });

    if (bestCandidate) {
      alert("ההצבעה האנונימית נרשמה בהצלחה");
      onAutoVote(bestCandidate.id);
    } else {
      alert("לא נמצאה התאמה מספקת");
    }
  };

  return (
    <div style={STYLES.modalOverlay}>
      <div style={STYLES.modalContent}>
        <h2 style={{ marginTop: 0 }}>שאלון התאמה אנונימי</h2>
        <p style={{ color: COLORS.textSec, marginBottom: "20px" }}>
          לאחר מילוי השאלון נבחר המועמד הקרוב ביותר לעמדותיך, ללא חשיפת הבחירה.
        </p>

        {QUESTIONS.map((q, idx) => (
          <div key={q} style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontWeight: "500",
              }}
            >
              {q}
            </label>
            <select
              style={STYLES.input}
              value={userAnswers[idx]}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
            >
              <option value="0">לא מסכים</option>
              <option value="1">מסכים</option>
            </select>
          </div>
        ))}

        <div style={{ display: "flex", gap: "10px", marginTop: "1.5rem" }}>
          <button
            onClick={calculateBestMatch}
            style={{
              ...STYLES.btn,
              backgroundColor: COLORS.accent,
              color: "white",
              flex: 1,
            }}
          >
            בחירה אוטומטית
          </button>
          <button
            onClick={onClose}
            style={{
              ...STYLES.btn,
              backgroundColor: COLORS.muted,
              color: COLORS.textMain,
              flex: 1,
            }}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartVoteModal;
