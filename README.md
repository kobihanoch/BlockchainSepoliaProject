# My Voting App

A decentralized voting application built with **React + Ethers.js + Solidity**, deployed and tested on the **Ethereum Sepolia testnet**.

This project was developed as an **academic assignment** in a Blockchain course, with a focus on combining smart contracts, wallet-based authentication, and a clear web interface for election management and voting.

## Project Idea

Traditional voting apps usually rely on centralized backends. In this project, core voting logic is moved to a smart contract so election rules are transparent and verifiable on-chain.

Key idea:

- Store election state (candidates, voting window, votes) on blockchain.
- Allow only approved voters using a Merkle-tree allowlist proof.
- Prevent double-voting directly in the contract.
- Reward voters with ERC-20 tokens after a valid vote.

## Screenshots

> Replace these placeholders with your actual screenshot file paths.

### Admin Dashboard

![Admin Dashboard Placeholder]("https://github.com/user-attachments/assets/a7965986-9427-4567-851d-da7f4e3b8c14")

### Voting Page

![Voting Page Placeholder]("https://github.com/user-attachments/assets/591e62ae-eedc-44b0-b5c4-7f9a23a0ce44")

### Smart Match Modal

![Smart Match Modal Placeholder]("https://github.com/user-attachments/assets/73d06553-1339-47e5-949b-f17424ee1f35")

## Why Sepolia

The app uses **Sepolia** because it provides an Ethereum-like environment without real fund risk.

Benefits in this project:

- Real wallet interaction through MetaMask.
- Real transaction signing and confirmation flow.
- Safe environment for academic experimentation and testing.

## Core Features

- Wallet connection with MetaMask.
- Voter and admin flows.
- On-chain candidate management.
- On-chain voting time window management.
- Merkle-root synchronization for allowlist validation.
- One vote per wallet enforced in contract.
- ERC-20 reward distribution after successful vote.
- Live election refresh based on on-chain data.

## Architecture Overview

Frontend:

- React (Vite)
- Ethers.js for blockchain calls
- React Router for voter/admin routes

Smart Contract:

- `contracts/Election.sol`
- Inherits ERC-20 (OpenZeppelin)
- Uses `MerkleProof` to validate voter allowlist

Data Flow:

1. User connects MetaMask.
2. App verifies network is Sepolia.
3. App reads election state from contract.
4. User/admin sends transactions for write actions.
5. UI refreshes from chain after confirmations.

## Smart Contract Highlights

`Election.sol` includes:

- `addCandidate(...)` (admin only)
- `setVotingTimes(...)` (admin only)
- `setMerkleRoot(...)` (admin only)
- `vote(candidateId, proof)` with:
  - election-window checks
  - one-vote-per-wallet protection
  - Merkle proof validation
  - token reward transfer

## Tech Stack

- React 19
- Vite 7
- Ethers 6
- Solidity 0.8.x
- OpenZeppelin Contracts
- MetaMask
- Ethereum Sepolia

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
npm run preview
```

## Prerequisites

- Node.js (LTS recommended)
- MetaMask browser extension
- Sepolia test ETH in your wallet
- Contract deployed on Sepolia (address configured in app)

## Academic Context

This repository is part of a university-level Blockchain final project.

Learning goals addressed:

- Smart-contract design and constraints.
- Frontend-to-blockchain integration.
- Transaction lifecycle UX.
- Access control and allowlist design via Merkle trees.
- Practical deployment/testing workflow on Sepolia.

## Repository Structure

- `src/` - React frontend
- `contracts/` - Solidity smart contract(s)
- `src/pages/` - voter/admin pages
- `src/utils/` - ABI, allowlist, Merkle utilities

## Notes

- This app is currently configured for **Sepolia**.
- Contract addresses and ABI are managed in frontend config/state.
- Testnet data can change based on deployments and transactions.
