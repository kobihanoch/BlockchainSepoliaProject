import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { STYLES, COLORS } from "../utils/theme";
import CandidateCard from "../components/CandidateCard";
import SmartVoteModal from "../components/SmartVoteModal";
import { ALLOWLIST } from "../utils/allowlist";
import { getProof, isAllowed } from "../utils/merkle";

const VotingPage = ({
  candidates,
  setCandidates,
  times,
  contractConfig,
  wallet,
  onConnect,
  contract,
  provider,
  refreshElection,
  isAdmin,
  networkOk,
  status,
  setStatus,
  allowlistRoot,
  allowlistSize,
}) => {
  const [hasVoted, setHasVoted] = useState(false); // If already voted
  const [showSmartModal, setShowSmartModal] = useState(false); // Modal state
  const [rewardStatus, setRewardStatus] = useState(""); // Reward status
  const [isSubmitting, setIsSubmitting] = useState(false); // Is submitting state

  // Derived variables from election times
  const now = new Date().toISOString().slice(0, 16);
  const isStarted = times.start && now >= times.start;
  const isEnded = times.end && now > times.end;
  const isActive = isStarted && !isEnded;

  // Once contract and wallet are connected update hasVoted state
  useEffect(() => {
    if (!contract || !wallet) {
      setHasVoted(false);
      return;
    }
    contract
      .hasVoted(wallet)
      .then((result) => setHasVoted(result))
      .catch(() => setHasVoted(false));
  }, [contract, wallet]);

  // If not connected to wallet or Sepolia
  useEffect(() => {
    if (!networkOk && wallet) {
      setStatus("יש להתחבר לרשת Sepolia");
    }
  }, [networkOk, wallet, setStatus]);

  const handleVote = async (candidateId) => {
    if (!wallet) return alert("יש להתחבר לארנק לפני ההצבעה");
    if (!contract || !provider) return alert("החוזה לא נטען");
    if (!networkOk) return alert("יש להתחבר לרשת Sepolia");
    if (hasVoted) return alert("הצבעה כבר נרשמה");
    if (!isAllowed(ALLOWLIST, wallet)) {
      return alert("הכתובת אינה ברשימת הבוחרים המאושרים");
    }
    const proofArray = getProof(ALLOWLIST, wallet);
    if (!proofArray.length) return alert("לא נמצאה הוכחה לכתובת זו");

    try {
      setIsSubmitting(true);
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      const tx = await writeContract.vote(candidateId, proofArray);
      await tx.wait();
      setHasVoted(true);
      setShowSmartModal(false);
      setRewardStatus("ההצבעה נרשמה והתגמול נשלח");
      await refreshElection();
    } catch (error) {
      setStatus("ההצבעה נכשלה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "לא הוגדר";
    const [date, time] = value.split("T");
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year} ${time}`;
  };

  return (
    <div style={STYLES.layout}>
      <nav style={STYLES.navbar}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1
            style={{ fontSize: "1.25rem", margin: 0, color: COLORS.textMain }}
          >
            מערכת בחירות מבוזרת 2025
          </h1>
          <span style={{ fontSize: "0.9rem", color: COLORS.textSec }}>
            הצבעה בטוחה עם התאמה לפי עמדות הבוחר
          </span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {isAdmin && (
            <Link
              to="/admin"
              style={{
                textDecoration: "none",
                color: COLORS.textSec,
                fontWeight: "500",
              }}
            >
              ממשק אדמין
            </Link>
          )}
          <button
            onClick={onConnect}
            style={{
              ...STYLES.btn,
              backgroundColor: wallet ? COLORS.surface : COLORS.primary,
              color: wallet ? COLORS.success : "white",
              border: wallet ? `1px solid ${COLORS.success}` : "none",
            }}
          >
            {wallet ? `מחובר: ${wallet.slice(0, 6)}...` : "חיבור ארנק"}
          </button>
        </div>
      </nav>

      <main style={STYLES.mainContent}>
        {status && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
            }}
          >
            {status}
          </div>
        )}
        <div
          style={{
            backgroundColor: isActive
              ? "#dcfce7"
              : isEnded
                ? "#fee2e2"
                : "#ffedd5",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center",
            border: `1px solid ${isActive ? "#86efac" : isEnded ? "#fca5a5" : "#fdba74"}`,
            color: isActive ? "#14532d" : isEnded ? "#7f1d1d" : "#7c2d12",
            fontWeight: "bold",
          }}
        >
          {!isStarted
            ? "הבחירות טרם נפתחו"
            : isActive
              ? "הבחירות פתוחות להצבעה"
              : "הבחירות הסתיימו"}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ ...STYLES.card, padding: "1.25rem" }}>
            <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
              זמן התחלה
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              {formatDateTime(times.start)}
            </div>
          </div>
          <div style={{ ...STYLES.card, padding: "1.25rem" }}>
            <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
              זמן סיום
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              {formatDateTime(times.end)}
            </div>
          </div>
          <div style={{ ...STYLES.card, padding: "1.25rem" }}>
            <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
              סטטוס תגמול
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              {rewardStatus || "יתעדכן לאחר הצבעה"}
            </div>
          </div>
          <div
            style={{ ...STYLES.card, padding: "1.25rem", overflowX: "scroll" }}
          >
            <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
              כתובת חוזה
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: "600" }}>
              {contractConfig.votingAddress || "לא הוגדרה כתובת"}
            </div>
          </div>
          <div style={{ ...STYLES.card, padding: "1.25rem" }}>
            <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
              רשימת בוחרים
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
              {allowlistSize} כתובות מאושרות
            </div>
            <div style={{ fontSize: "0.85rem", color: COLORS.textSec }}>
              שורש מרקל: {allowlistRoot.slice(0, 10)}...
            </div>
          </div>
        </div>
        {wallet && !isAllowed(ALLOWLIST, wallet) && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
            }}
          >
            הכתובת המחוברת אינה ברשימת הבוחרים המאושרים
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.8rem", color: COLORS.textMain, margin: 0 }}>
            מועמדים
          </h2>
          {isActive && !hasVoted && (
            <button
              onClick={() => setShowSmartModal(true)}
              style={{
                ...STYLES.btn,
                backgroundColor: COLORS.accent,
                color: "white",
              }}
            >
              התאמה חכמה לפי שאלון
            </button>
          )}
        </div>

        <div style={STYLES.gridContainer}>
          {!isEnded
            ? candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isActive={isActive}
                  hasVoted={hasVoted || isSubmitting}
                  onVote={handleVote}
                />
              ))
            : candidates
                .slice()
                .sort((a, b) => b.votes - a.votes)
                .map((c, idx) => (
                  <div
                    key={c.id}
                    style={{
                      ...STYLES.card,
                      border:
                        idx === 0 ? "2px solid #eab308" : STYLES.card.border,
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: COLORS.textSec,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {idx === 0
                          ? "מקום ראשון"
                          : idx === 1
                            ? "מקום שני"
                            : "מקום שלישי"}
                      </div>
                      <h3>{c.name}</h3>
                      <p
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: COLORS.primary,
                        }}
                      >
                        {c.votes} קולות
                      </p>
                    </div>
                  </div>
                ))}
        </div>
      </main>

      {showSmartModal && (
        <SmartVoteModal
          candidates={candidates}
          onClose={() => setShowSmartModal(false)}
          onAutoVote={handleVote}
        />
      )}
    </div>
  );
};

export default VotingPage;
