import React, { useState } from "react";
import { Link } from "react-router-dom";
import { STYLES, COLORS } from "../utils/theme";
import { QUESTIONS } from "../utils/questions";

const AdminPage = ({
  candidates,
  setCandidates,
  times,
  setTimes,
  contractConfig,
  wallet,
  onConnect,
  isAdmin,
  contract,
  provider,
  refreshElection,
  networkOk,
  status,
  setStatus,
  allowlistRoot,
  allowlistSize,
}) => {
  // Add candidate section
  const [name, setName] = useState(""); // New candidate name
  const [candidateAnswers, setCandidateAnswers] = useState([0, 0, 0]); // New candidate answers
  const [isSaving, setIsSaving] = useState(false); // Saving state

  const handleAnswerChange = (index, value) => {
    const next = [...candidateAnswers];
    next[index] = parseInt(value, 10);
    setCandidateAnswers(next);
  };

  const handleAddCandidate = async () => {
    if (!name.trim()) return;
    if (!wallet) return setStatus("יש להתחבר לארנק מנהל");
    if (!isAdmin) return setStatus("אין הרשאת מנהל");
    if (!contract || !provider) return setStatus("החוזה לא נטען");
    if (!networkOk) return setStatus("יש להתחבר לרשת Sepolia");

    try {
      setIsSaving(true);
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      const tx = await writeContract.addCandidate(
        name.trim(),
        candidateAnswers,
      );
      await tx.wait();
      setName("");
      setCandidateAnswers([0, 0, 0]);
      await refreshElection();
      setStatus("מועמד נוסף בהצלחה");
    } catch (error) {
      setStatus("הוספת מועמד נכשלה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTimes = async () => {
    if (!wallet) return setStatus("יש להתחבר לארנק מנהל");
    if (!isAdmin) return setStatus("אין הרשאת מנהל");
    if (!contract || !provider) return setStatus("החוזה לא נטען");
    if (!networkOk) return setStatus("יש להתחבר לרשת Sepolia");
    if (!times.start || !times.end) return setStatus("יש למלא זמן התחלה וסיום");

    try {
      setIsSaving(true);
      const start = Math.floor(new Date(times.start).getTime() / 1000);
      const end = Math.floor(new Date(times.end).getTime() / 1000);
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      const tx = await writeContract.setVotingTimes(start, end);
      await tx.wait();
      await refreshElection();
      setStatus("חלון הזמן נשמר בחוזה");
    } catch (error) {
      setStatus("עדכון חלון הזמן נכשל");
    } finally {
      setIsSaving(false);
    }
  };

  const syncMerkleRoot = async (root) => {
    if (!root) return;
    if (!wallet || !isAdmin || !contract || !provider || !networkOk) return;
    try {
      const current = await contract.merkleRoot();
      if (current.toLowerCase() === root.toLowerCase()) return;
      setIsSaving(true);
      const signer = await provider.getSigner();
      const writeContract = contract.connect(signer);
      const tx = await writeContract.setMerkleRoot(root);
      await tx.wait();
      setStatus("שורש מרקל סונכרן");
    } catch (error) {
      setStatus("סנכרון שורש מרקל נכשל");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncMerkleRoot = async () => {
    if (!allowlistRoot) return setStatus("שורש מרקל לא זמין");
    await syncMerkleRoot(allowlistRoot);
  };

  return (
    <div style={STYLES.layout}>
      <nav style={STYLES.navbar}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1
            style={{ fontSize: "1.25rem", margin: 0, color: COLORS.textMain }}
          >
            ניהול בחירות
          </h1>
          <span style={{ fontSize: "0.9rem", color: COLORS.textSec }}>
            ממשק אדמין לניהול מועמדים, זמנים וחוזים
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link
            to="/"
            style={{
              ...STYLES.btn,
              backgroundColor: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.textMain,
              textDecoration: "none",
            }}
          >
            חזרה להצבעה
          </Link>
          {!wallet && (
            <button
              onClick={onConnect}
              style={{
                ...STYLES.btn,
                backgroundColor: COLORS.primary,
                color: "white",
              }}
            >
              חיבור ארנק מנהל
            </button>
          )}
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
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
            gap: "2rem",
          }}
        >
          <div style={STYLES.card}>
            <h3 style={{ marginTop: 0 }}>חלון זמן לבחירות</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  זמן התחלה
                </label>
                <input
                  type="datetime-local"
                  style={STYLES.input}
                  value={times.start}
                  onChange={(e) =>
                    setTimes({ ...times, start: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  זמן סיום
                </label>
                <input
                  type="datetime-local"
                  style={STYLES.input}
                  value={times.end}
                  onChange={(e) => setTimes({ ...times, end: e.target.value })}
                />
              </div>
              <button
                onClick={handleSaveTimes}
                disabled={isSaving}
                style={{
                  ...STYLES.btn,
                  backgroundColor: COLORS.primary,
                  color: "white",
                }}
              >
                שמירת חלון זמן בבלוקצ'יין
              </button>
            </div>
          </div>

          <div style={STYLES.card}>
            <h3 style={{ marginTop: 0 }}>הוספת מועמד</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                height: "100%",
              }}
            >
              <input
                placeholder="שם מלא של המועמד"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={STYLES.input}
              />
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {QUESTIONS.map((q, idx) => (
                  <div key={q}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.35rem",
                        fontWeight: "500",
                      }}
                    >
                      {q}
                    </label>
                    <select
                      style={STYLES.input}
                      value={candidateAnswers[idx]}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    >
                      <option value="0">לא תומך</option>
                      <option value="1">תומך</option>
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddCandidate}
                disabled={isSaving}
                style={{
                  ...STYLES.btn,
                  backgroundColor: COLORS.primary,
                  color: "white",
                  marginTop: "auto",
                }}
              >
                הוספה לרשימת המועמדים
              </button>
            </div>
          </div>

          <div style={STYLES.card}>
            <h3 style={{ marginTop: 0 }}>פרטי חוזה (קריאה בלבד)</h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
                  רשת עבודה
                </div>
                <div style={{ fontWeight: "600" }}>
                  {contractConfig.network || "לא הוגדר"}
                </div>
              </div>
              <div>
                <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
                  כתובת חוזה הבחירות
                </div>
                <div style={{ fontWeight: "600" }}>
                  {contractConfig.votingAddress || "לא הוגדרה"}
                </div>
              </div>
              <div>
                <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
                  כתובת חוזה תגמול BAL (ERC20)
                </div>
                <div style={{ fontWeight: "600" }}>
                  {contractConfig.tokenAddress || "לא הוגדרה"}
                </div>
              </div>
              <div>
                <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
                  ABI
                </div>
                <div style={{ fontWeight: "600" }}>
                  {contractConfig.abi ? "נטען" : "לא נטען"}
                </div>
              </div>
              <div>
                <div style={{ color: COLORS.textSec, fontSize: "0.9rem" }}>
                  שורש מרקל מהרשימה המאושרת ({allowlistSize} כתובות מאושרות)
                </div>
                <div style={{ fontWeight: "600" }}>{allowlistRoot}</div>
              </div>
              <button
                onClick={handleSyncMerkleRoot}
                disabled={isSaving}
                style={{
                  ...STYLES.btn,
                  backgroundColor: COLORS.primary,
                  color: "white",
                }}
              >
                סנכרון שורש מרקל לחוזה
              </button>
            </div>
          </div>
        </div>

        <h2 style={{ marginTop: "3rem" }}>מצב מועמדים בזמן אמת</h2>
        <div style={{ ...STYLES.card, padding: 0, overflow: "hidden" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "right",
            }}
          >
            <thead
              style={{
                backgroundColor: "#f8fafc",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <tr>
                <th style={{ padding: "1rem" }}>מזהה</th>
                <th style={{ padding: "1rem" }}>שם</th>
                <th style={{ padding: "1rem" }}>מספר קולות</th>
                <th style={{ padding: "1rem" }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    style={{ padding: "1rem", textAlign: "center" }}
                  >
                    אין מועמדים ברשימה עדיין.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: `1px solid ${COLORS.border}` }}
                  >
                    <td style={{ padding: "1rem" }}>{c.id}</td>
                    <td style={{ padding: "1rem", fontWeight: "500" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "1rem" }}>{c.votes}</td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ color: COLORS.success }}>פעיל</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
