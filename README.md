# University Diploma System

Blockchain-based diploma verification system built with Ethereum smart contracts.

## Tech Stack

- **Smart Contracts**: Solidity 0.8.20, Truffle
- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Vite, Tailwind CSS
- **Blockchain**: Ethereum (Sepolia testnet)

## Project Structure

```
├── contracts/          # Solidity smart contracts
├── backend/            # Express API server
└── nft-diploma-frontend/   # React frontend
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../nft-diploma-frontend && npm install
   ```

2. Configure environment variables in `.env`:
   ```
   MNEMONIC=your_wallet_mnemonic
   INFURA_PROJECT_ID=your_infura_id
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

3. Deploy contracts:
   ```bash
   truffle migrate --network sepolia
   ```

4. Start backend:
   ```bash
   cd backend && node server.js
   ```

5. Start frontend:
   ```bash
   cd nft-diploma-frontend && npm run dev
   ```

## Features

- Issue blockchain-verified diplomas as NFTs
- Verify diploma authenticity
- Student diploma portfolio
- Admin dashboard for diploma management

