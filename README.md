# 🏄‍♂️ AlohaToken Ecosystem

AlohaToken is a complete decentralized application (dApp) that rewards real-world surf sessions with blockchain tokens. The ecosystem consists of three main components: a smart contract, a web application, and a signature middleware server that work together to create a seamless surf session tracking and reward system.

## 🌊 Overview

The AlohaToken ecosystem enables surfers to:
- Register with unique aliases and profile information
- Submit and approve surf sessions collaboratively
- Earn ALOHA tokens based on waves surfed and performance
- View session history and community statistics
- Participate in a non-transferable token economy focused on surf participation

## 📦 Components

### 1. 🪙 Smart Contract (`/contracts`)
**AlohaToken.sol** - ERC-20 token with specialized surf session logic

**Features:**
- **Non-transferable ERC-20 token** (ALOHA, 18 decimals)
- **Surfer registration** with unique aliases and profile hashes
- **Session approval workflow** with cryptographic signatures
- **Token rewards** per wave surfed (1 ALOHA per wave)
- **Performance bonuses/penalties**: +5 ALOHA for best wave, -3 ALOHA for kook
- **Rate limiting** to prevent spam sessions
- **Owner controls** for governance and emergency management

### 2. 🌐 Web Application (`/app`)
**React + TypeScript frontend** for user interaction

**Features:**
- **Wallet connection** via RainbowKit (MetaMask, WalletConnect, etc.)
- **Surfer registration** and profile management
- **Session submission** with participant selection and wave tracking
- **Session history** and detailed session views
- **Community leaderboards** and statistics
- **Responsive design** optimized for mobile and desktop

**Tech Stack:**
- React 18 + TypeScript
- RainbowKit + wagmi for wallet integration
- Modern CSS with design system
- Ethers.js for blockchain interaction

### 3. 🖥️ Signature Server (`/signature-server`)
**Middleware API** for signature collection and batching

**Features:**
- **Temporary signature storage** (7-day expiration with auto-cleanup)
- **RESTful API** for signature submission and retrieval
- **Session/surfer filtering** for organized signature collection
- **CORS enabled** for seamless frontend integration
- **High performance** TypeScript server

**Tech Stack:**
- Bun runtime for maximum performance
- TypeScript for type safety
- In-memory storage with automatic cleanup
- RESTful API design

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ 
- **npm** or **yarn**
- **Git**
- **Bun** (for signature server)

### 1. Clone and Install
```bash
git clone https://github.com/your-username/alohaToken.git
cd alohaToken
npm install
```

### 2. Start Development Environment
```bash
# Start all services (blockchain + signature server + frontend)
./scripts/dev-node.sh
```

This single command will:
- ✅ Start local Hardhat blockchain (port 8545)
- ✅ Deploy AlohaToken contract
- ✅ Start signature server (port 3001)
- ✅ Launch React frontend (port 3000)

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Signature Server**: http://localhost:3001
- **Blockchain RPC**: http://localhost:8545

## 🔧 Development

### Smart Contract Development
```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to localhost
npx hardhat --network localhost run scripts/dev-deployment.ts

# Gas reporting
REPORT_GAS=true npx hardhat test
```

### Frontend Development
```bash
cd app
npm start                 # Development server
npm run build            # Production build
npm test                 # Run tests
```

### Signature Server Development
```bash
cd signature-server
bun run main.ts          # Start server
curl http://localhost:3001/status  # Health check
```

## 📋 Workflow

### 1. Surfer Registration
1. Connect Ethereum wallet
2. Submit registration with unique alias
3. Wait for community approvals
4. Registration complete once approved

### 2. Session Submission
1. Create new session with details
2. Add participating surfers
3. Set wave counts for each participant
4. Choose best wave and kook surfer
5. Collect cryptographic signatures
6. Submit to blockchain for token rewards

### 3. Signature Collection Flow
1. Users sign approvals with their wallets
2. Signatures stored temporarily in server
3. Batch collection of multiple signatures
4. Submit all signatures to blockchain
5. Automatic cleanup of processed signatures

## 🏄‍♀️ Usage Examples

### Register as a Surfer
1. Connect your Ethereum wallet
2. Navigate to registration page
3. Choose unique alias and fill profile
4. Submit registration (requires community approval)

### Submit a Surf Session
1. Go to "New Session" page
2. Add session details (location, date, conditions)
3. Select participating surfers
4. Set wave counts for each surfer
5. Choose best wave and kook surfer
6. Submit for approval

### Approve Sessions/Surfers
1. View pending approvals
2. Sign approval with your wallet
3. Signatures stored temporarily in server
4. When enough signatures collected, submit to blockchain

## 🔗 API Reference

### Signature Server Endpoints
```http
GET    /status                          # Health check
POST   /signatures                      # Submit signature
GET    /signatures/session/{sessionId}  # Get session signatures
GET    /signatures/surfer/{surferId}    # Get surfer signatures
DELETE /signatures/{signatureId}        # Remove signature
```

### Smart Contract Key Functions
```solidity
registerSurfer(bytes32 alias, string profileHash)  // Register new surfer
submitSession(SessionData)                          // Submit approved session
approveSurfer(bytes32 surferId)                    // Approve surfer registration
```

## 🎯 Token Economics

### Earning ALOHA Tokens
- **Base reward**: 1 ALOHA per wave surfed
- **Best wave bonus**: +5 ALOHA for session's best performer
- **Kook penalty**: -3 ALOHA for session's worst performer
- **Non-transferable**: Tokens cannot be sent between accounts

### Session Requirements
- **Minimum participants**: 2 surfers
- **Required approvals**: Configurable by contract owner
- **Time intervals**: Rate limiting prevents spam sessions
- **Cryptographic approval**: All participants must sign

## 🛡️ Security

### Smart Contract Security
- **Pausable contract** for emergency stops
- **Owner controls** for critical functions
- **Rate limiting** to prevent abuse
- **Input validation** on all functions

### Signature Server Security
- **Temporary storage** (7-day expiration)
- **CORS protection** for web integration
- **Input validation** and sanitization
- **No persistent sensitive data**

## 🚀 Deployment

### Local Development
```bash
./scripts/dev-node.sh  # Complete development environment
```

### Production Deployment

#### Smart Contract
```bash
# Deploy to mainnet/testnet
npx hardhat --network <network> run scripts/deploy.ts
```

#### Frontend
```bash
cd app
npm run build
# Deploy build/ directory to hosting service
```

#### Signature Server
```bash
cd signature-server
# Deploy to VPS/cloud service
bun run main.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- **Smart contracts**: Follow Solidity best practices
- **Frontend**: Use TypeScript and follow React patterns
- **Signature server**: Maintain RESTful API design
- **Testing**: Write tests for all new features

## 📚 Documentation

- **Smart Contract**: See [`contracts/README.md`](contracts/README.md)
- **Frontend**: See [`app/README.md`](app/README.md)
- **Signature Server**: See [`signature-server/README.md`](signature-server/README.md)
- **API Documentation**: Available at [`signature-server/README.md`](signature-server/README.md)

---

**Built with ❤️ by the surf community, for the surf community** 🌊

*Ride the wave, earn the token, join the tribe!*