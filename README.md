# AlohaToken

AlohaToken is an ERC-20 token designed to reward real-world surf sessions with on-chain tokens. Surfers register with an immutable alias and off-chain profile hash, agree on sessions via cryptographic approvals, and earn tokens per wave. Sessions have enforced time intervals, and top performers receive bonus tokens while kooks incur burns. Tokens are non-transferable and managed by session logic or the contract owner.

## Features
- ERC-20 token with:
  - Name: "AlohaToken"
  - Symbol: "ALOHA"
  - Decimals: 18
- Non-transferable: transfers always revert
- Surfer registration:
  - Unique alias → bytes32 ID
  - Off-chain profile hash stored on-chain
  - Rate-limited additions (time interval + minimum approvals)
- Surf session workflow:
  - Cryptographically-approved by session participants
  - Mints tokens per wave ridden
  - +5 ALOHA bonus to best wave surfer
  - −3 ALOHA burn from kook surfer
  - Rate-limited session submissions
- Owner controls:
  - Minting & burning
  - Setting minimum approvals & time intervals
  - Deleting & editing surfers
  - Pausing the contract

## Prerequisites
- Node.js v12+  
- npm or yarn  
- Git  

## Installation

```bash
git clone https://github.com/your-username/alohaToken.git
cd alohaToken
npm install
# or
yarn install
```

## Compilation

Compile smart contracts:

```bash
npx hardhat compile
```

## Testing

Run the full test suite:

```bash
npx hardhat test
```

With gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```