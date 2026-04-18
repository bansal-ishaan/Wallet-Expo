# LCB2025011 - Wallet Expo Project

## 1) Project Summary

This project is an independent, non-custodial Web3 wallet implementation.
It is designed so wallet creation/import, key encryption/decryption, transaction signing, and transaction broadcast happen client-side through RPC, without MetaMask dependency.

The repository is split into:
- FRONTEND: React wallet application (UI + client-side wallet engine)
- BACKEND: Solidity contract + Hardhat deployment setup

## 2) Core Features

### Wallet Features
- Create a new wallet 
- Import an existing wallet using seed phrase or private key
- Encrypt and store wallet data in browser storage
- Unlock wallet using password
- Display public address and native balance

### Transaction Features
- Build and sign ETH/native transfer locally in browser
- Estimate gas before sending
- Broadcast signed transaction to selected network RPC
- Show transaction hash and status
- Show transaction history through explorer API integration (with fallback handling)

### Network Support
- Ethereum Sepolia
- Base Sepolia
- Monad Testnet

### Extra Sections Included
- NFT section (API-based retrieval where endpoint support exists)
- Security section with controlled private key reveal flow

## 3) Tech Stack

### Frontend
- React (Vite)
- ethers.js
- wagmi + viem
- @tanstack/react-query

### Backend
- Solidity 0.8.24
- Hardhat 2.x
- @nomicfoundation/hardhat-toolbox
- dotenv

## 4) Project Structure

- FRONTEND/
  - src/App.jsx: main wallet logic, flows, and sectioned dashboard UI
  - src/config/chains.js: supported network metadata and API config mapping
  - src/wagmi.js: chain transport/public client configuration
  - .env / .env.example: RPC, explorer API, NFT API, deployed contract addresses

- BACKEND/
  - contracts/WalletVault.sol: owner-controlled ETH vault contract
  - scripts/deploy.js: deployment script for configured network
  - hardhat.config.js: sepolia, baseSepolia, monad network settings
  - .env / .env.example: RPC URLs + deployer private key

## 5) Smart Contract Details

Contract: WalletVault

Main behavior:
- Accept ETH via receive()
- Emit Deposit event on ETH receipt
- Allow owner-only transferETH(to, amount, transferRef)
- Emit TransferExecuted event for outgoing transfers
- Expose getBalance() for current contract balance

## 6) Setup Instructions

### Prerequisites
- Node.js 18+
- npm

### Frontend Setup
1. Open terminal in FRONTEND
2. Install dependencies:
	npm install
3. Create .env from .env.example and fill values
4. Run development server:
	npm run dev
5. Production build:
	npm run build

### Backend Setup
1. Open terminal in BACKEND
2. Install dependencies:
	npm install
3. Create .env from .env.example and fill values
4. Compile contracts:
	npm run compile
5. Deploy to network:
	npm run deploy:sepolia
	npm run deploy:baseSepolia
	npm run deploy:monad

## 7) Security Notes

- Wallet is non-custodial: keys are controlled by the user.
- Encrypted wallet JSON is stored in local browser storage.
- Do not commit real secrets in .env files.
- Use dedicated low-value test accounts for testnets.

## 8) Current Status

- Frontend build: successful
- Backend compile and deployment workflow: configured and operational
- Multi-chain and feature sections implemented

## 9) Submission Notes

For final submission/demo:
- Add deployed frontend URL
- Add deployed contract addresses per network
- Add demo video link
