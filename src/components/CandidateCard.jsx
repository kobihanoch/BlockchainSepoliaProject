import React from "react";
import { STYLES, COLORS } from "../utils/theme";

const CandidateCard = ({ candidate, isActive, hasVoted, onVote }) => {
  const initials = candidate.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div style={STYLES.card}>
      <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            background: COLORS.muted,
            borderRadius: "50%",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem",
            fontWeight: "700",
            color: COLORS.textMain,
          }}
        >
          {initials || "?"}
        </div>
        <h3
          style={{
            margin: "0 0 0.5rem",
            color: COLORS.textMain,
            fontSize: "1.25rem",
          }}
        >
          {candidate.name}
        </h3>
        <span
          style={{
            color: COLORS.textSec,
            fontSize: "0.9rem",
            background: COLORS.muted,
            padding: "0.2rem 0.6rem",
            borderRadius: "4px",
          }}
        >
          מזהה מועמד: {candidate.id}
        </span>
      </div>

      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            marginBottom: "1rem",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: COLORS.primary,
          }}
        >
          {candidate.votes} קולות
        </div>
        <button
          disabled={!isActive || hasVoted}
          onClick={() => onVote(candidate.id)}
          style={{
            ...STYLES.btn,
            width: "100%",
            backgroundColor: hasVoted
              ? COLORS.border
              : isActive
                ? COLORS.success
                : COLORS.border,
            color: hasVoted || !isActive ? COLORS.textSec : "white",
            cursor: !isActive || hasVoted ? "not-allowed" : "pointer",
          }}
        >
          {hasVoted ? "הצבעת כבר" : "הצבעה"}
        </button>
      </div>
    </div>
  );
};

export default CandidateCard;
