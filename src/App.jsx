import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ethers } from "ethers";
import AdminPage from "./pages/AdminPage";
import VotingPage from "./pages/VotingPage";
import { CONTRACT_ABI } from "./utils/contractAbi";
import { ALLOWLIST } from "./utils/allowlist";
import { getMerkleRoot } from "./utils/merkle";

// Example
const INITIAL_CANDIDATES = [
  { id: 1, name: "קובי חנוך", votes: 0, answers: [1, 1, 0] },
  { id: 2, name: "עומר נוף", votes: 0, answers: [0, 1, 1] },
  { id: 3, name: "מיכה ברשפ", votes: 0, answers: [1, 0, 0] },
];

function App() {
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES); // Candidates list
  const [times, setTimes] = useState({ start: "", end: "" }); // Time window of voting
  const [contractConfig, setContractConfig] = useState({
    // Contract states
    network: "sepolia",
    votingAddress: "0x2b785bD5997379C94e16802FCF50B4CDbE4f92cd",
    tokenAddress: "0x2b785bD5997379C94e16802FCF50B4CDbE4f92cd",
    merkleRoot: "",
    abi: JSON.stringify(CONTRACT_ABI, null, 2),
  });
  const [wallet, setWallet] = useState(""); // Connected wallet
  const [provider, setProvider] = useState(null); // Blockchain object
  const [contract, setContract] = useState(null); // Connected contract object
  const [isAdmin, setIsAdmin] = useState(false); // Is current user is admin
  const [networkOk, setNetworkOk] = useState(false); // Is the current network is sepolia
  const [status, setStatus] = useState(""); // Info/Error for user

  // Parse from ABI JSON
  const parsedAbi = useMemo(() => {
    try {
      return JSON.parse(contractConfig.abi || "[]");
    } catch (error) {
      return CONTRACT_ABI;
    }
  }, [contractConfig.abi]);

  // Merkle root from allowlist
  const allowlistRoot = useMemo(() => getMerkleRoot(ALLOWLIST), []);

  // Update contract config's merkel's root when allowlist is updated
  useEffect(() => {
    setContractConfig((prev) => ({
      ...prev,
      merkleRoot: allowlistRoot,
    }));
  }, [allowlistRoot]);

  // Update states when connecting to blockchain
  useEffect(() => {
    if (!window.ethereum) return;
    const nextProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(nextProvider);

    // Current account
    const onAccounts = (accounts) => {
      setWallet(accounts && accounts[0] ? accounts[0] : "");
    };
    // Current network
    const onChain = () => {
      setStatus("");
      setNetworkOk(false);
    };

    // On listeners changes trigger callbacks
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);

    // Cleanups
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccounts);
      window.ethereum.removeListener("chainChanged", onChain);
    };
  }, []);

  // Make sure user is connected to sepolia
  useEffect(() => {
    if (!provider) return;
    provider
      .getNetwork()
      .then((net) => setNetworkOk(net.chainId === 11155111n))
      .catch(() => setNetworkOk(false));
  }, [provider]);

  // Create a contract object and update state
  useEffect(() => {
    if (!provider || !contractConfig.votingAddress) {
      setContract(null);
      return;
    }
    try {
      const next = new ethers.Contract(
        contractConfig.votingAddress,
        parsedAbi,
        provider,
      );
      setContract(next);
    } catch (error) {
      setContract(null);
    }
  }, [provider, contractConfig.votingAddress, parsedAbi]);

  const toInputTime = (secondsValue) => {
    if (!secondsValue || Number(secondsValue) === 0) return "";
    const ms = Number(secondsValue) * 1000;
    const iso = new Date(ms).toISOString();
    return iso.slice(0, 16);
  };

  // Update election states
  const refreshElection = async () => {
    if (!contract) return;
    try {
      const count = await contract.candidatesCount();
      const total = Number(count);
      const nextCandidates = [];
      for (let i = 1; i <= total; i += 1) {
        const item = await contract.getCandidate(i);
        nextCandidates.push({
          id: Number(item[0]),
          name: item[1],
          votes: Number(item[2]),
          answers: item[3] ? Array.from(item[3]) : [0, 0, 0],
        });
      }
      setCandidates(nextCandidates);
      const start = await contract.votingStart();
      const end = await contract.votingEnd();
      setTimes({ start: toInputTime(start), end: toInputTime(end) });
    } catch (error) {
      setStatus("לא ניתן למשוך נתונים מהחוזה");
    }
  };

  // When contract is loaded update election states
  useEffect(() => {
    refreshElection();
  }, [contract]);

  // Set if current user is admin
  // Admin is the first user to log in for current contract
  useEffect(() => {
    if (!contract || !wallet) {
      setIsAdmin(false);
      return;
    }
    contract
      .admin()
      .then((addr) => {
        setIsAdmin(addr.toLowerCase() === wallet.toLowerCase());
      })
      .catch(() => setIsAdmin(false));
  }, [contract, wallet]);

  // Connect account from MetaMask and update state
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus("נא להתקין תוסף Metamask");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0] || "");
    } catch (error) {
      setStatus("החיבור לארנק נכשל");
    }
  };

  // Listen to events on contract
  useEffect(() => {
    if (!contract) return;

    // Listener to votes
    const onVoted = (candidateId, voter) => {
      console.log("מישהו הצביע!", candidateId, voter);
      refreshElection();
    };

    contract.on("VotedEvent", onVoted);

    // Cleanup
    return () => {
      contract.off("VotedEvent", onVoted);
    };
  }, [contract]);

  const AdminGate = () => {
    if (!wallet) {
      return <Navigate to="/" replace />;
    }
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
    return (
      <AdminPage
        candidates={candidates}
        setCandidates={setCandidates}
        times={times}
        setTimes={setTimes}
        contractConfig={contractConfig}
        wallet={wallet}
        onConnect={connectWallet}
        isAdmin={isAdmin}
        contract={contract}
        provider={provider}
        refreshElection={refreshElection}
        networkOk={networkOk}
        status={status}
        setStatus={setStatus}
        allowlistRoot={allowlistRoot}
        allowlistSize={ALLOWLIST.length}
      />
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <VotingPage
              candidates={candidates}
              setCandidates={setCandidates}
              times={times}
              contractConfig={contractConfig}
              wallet={wallet}
              onConnect={connectWallet}
              contract={contract}
              provider={provider}
              refreshElection={refreshElection}
              isAdmin={isAdmin}
              networkOk={networkOk}
              status={status}
              setStatus={setStatus}
              allowlistRoot={allowlistRoot}
              allowlistSize={ALLOWLIST.length}
            />
          }
        />
        <Route path="/admin" element={<AdminGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
