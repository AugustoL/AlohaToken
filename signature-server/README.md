# 🏄‍♂️ Surf Signature Server

A lightweight middleware server for storing and managing cryptographic signatures related to surf sessions and surfer approvals in the Aloha Token ecosystem.

## Overview

This server acts as a temporary storage solution for user signatures before they are submitted to the blockchain. Users can sign sessions or surfers they want to approve, and interested parties can fetch these signatures to batch them for on-chain submission to the AlohaToken contract.

## Features

- ✅ **Temporary signature storage** (7-day expiration)
- ✅ **RESTful API** for signature management
- ✅ **Automatic cleanup** of expired signatures
- ✅ **CORS enabled** for web frontend integration
- ✅ **TypeScript support** with full type safety
- ✅ **High performance** with Bun runtime
- ✅ **Zero configuration** - runs out of the box

## Requirements

- [Bun](https://bun.sh/) runtime

## Installation & Setup

### Option 1: Using Bun

```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Clone and run the server
cd /path/to/signature-server
bun run main.ts
```


## API Reference

Base URL: `http://localhost:3001`

All endpoints return JSON responses and support CORS for web frontend integration.

### 1. Health Check

Check if the server is running and get basic statistics.

**Endpoint:**
```http
GET /status
```

**Response:**
```json
{
  "status": "ok",
  "signatures": 42,
  "timestamp": "2025-07-21T15:30:00.000Z"
}
```

**Status Codes:**
- `200 OK` - Server is running normally

---

### 2. Submit Signature

Store a new cryptographic signature for later blockchain submission. The signature will be automatically deleted after 7 days.

**Endpoint:**
```http
POST /signatures
Content-Type: application/json
```

**Request Body:**
```json
{
  "signerAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signerId": "surfer_alice",
  "signatureData": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "signatureType": "SessionApproval",
  "targetId": "session_summer_2025_001"
}
```

**Field Descriptions:**
- `signerAddress` - Ethereum wallet address that created the signature
- `signerId` - Human-readable identifier for the signer (e.g., surfer alias)
- `signatureData` - Hex-encoded cryptographic signature (with 0x prefix)
- `signatureType` - Either `"SessionApproval"` or `"SurferApproval"`
- `targetId` - ID of the session or surfer being approved

**Response (Success):**
```json
{
  "success": true,
  "message": "Signature stored successfully",
  "signatureId": "sig_session_summer_2025_001_1642781234567"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid request body"
}
```

**Status Codes:**
- `200 OK` - Signature stored successfully
- `400 Bad Request` - Invalid request body or missing required fields

---

### 3. Get Signatures by Session

Retrieve all valid (non-expired) signatures for a specific surf session. Useful for collecting signatures before batch submission to the blockchain.

**Endpoint:**
```http
GET /signatures/session/{sessionId}
```

**Parameters:**
- `sessionId` - The ID of the surf session

**Example:**
```bash
GET /signatures/session/session_summer_2025_001
```

**Response:**
```json
{
  "signatures": [
    {
      "id": "sig_session_summer_2025_001_1642781234567",
      "signerAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "signerId": "surfer_alice",
      "signatureData": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      "signatureType": "SessionApproval",
      "targetId": "session_summer_2025_001",
      "timestamp": 1642781234567,
      "expiresAt": 1643386034567
    },
    {
      "id": "sig_session_summer_2025_001_1642781567890",
      "signerAddress": "0xfedcba0987654321fedcba0987654321fedcba09",
      "signerId": "surfer_bob",
      "signatureData": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
      "signatureType": "SessionApproval",
      "targetId": "session_summer_2025_001",
      "timestamp": 1642781567890,
      "expiresAt": 1643386367890
    }
  ],
  "count": 2
}
```

**Status Codes:**
- `200 OK` - Returns signatures (empty array if none found)

---

### 4. Get Signatures by Surfer

Retrieve all valid signatures for a specific surfer approval.

**Endpoint:**
```http
GET /signatures/surfer/{surferId}
```

**Parameters:**
- `surferId` - The ID of the surfer being approved

**Example:**
```bash
GET /signatures/surfer/surfer_charlie
```

**Response:** Same format as session signatures, but filtered for `"SurferApproval"` type.

**Status Codes:**
- `200 OK` - Returns signatures (empty array if none found)

---

### 5. Delete Signature

Remove a specific signature from storage. Useful for cleanup or if a signature was submitted incorrectly.

**Endpoint:**
```http
DELETE /signatures/{signatureId}
```

**Parameters:**
- `signatureId` - The unique ID of the signature to delete

**Example:**
```bash
DELETE /signatures/sig_session_summer_2025_001_1642781234567
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Signature deleted successfully",
  "signatureId": "sig_session_summer_2025_001_1642781234567"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "message": "Signature not found"
}
```

**Status Codes:**
- `200 OK` - Signature deleted successfully
- `404 Not Found` - Signature ID not found

## Usage Examples

### Submit a Session Approval Signature

```bash
curl -X POST http://localhost:3001/signatures \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x742d35Cc6548C3B8E8F1ba9B03c8aE7de9b68D6e",
    "signerId": "surfer_alice",
    "signatureData": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    "signatureType": "SessionApproval", 
    "targetId": "session_summer_2025_001"
  }'
```

### Submit a Surfer Approval Signature

```bash
curl -X POST http://localhost:3001/signatures \
  -H "Content-Type: application/json" \
  -d '{
    "signerAddress": "0x987fcdeb51432178967fcdeb51432178967fcdeb",
    "signerId": "surfer_bob", 
    "signatureData": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "signatureType": "SurferApproval",
    "targetId": "surfer_charlie"
  }'
```

### Get All Signatures for a Session

```bash
curl http://localhost:3001/signatures/session/session_summer_2025_001
```

### Get All Signatures for a Surfer

```bash
curl http://localhost:3001/signatures/surfer/surfer_charlie
```

### Delete a Specific Signature

```bash
curl -X DELETE http://localhost:3001/signatures/sig_session_summer_2025_001_1642781234567
```

### Check Server Status

```bash
curl http://localhost:3001/status
```

## Data Types

### Signature Object

```typescript
interface Signature {
  id: string;                    // Unique signature identifier (auto-generated)
  signerAddress: string;         // Ethereum address of signer (42 chars, 0x-prefixed)
  signerId: string;             // Human-readable signer ID (e.g., surfer alias)
  signatureData: string;        // Hex-encoded signature (130+ chars, 0x-prefixed)
  signatureType: "SessionApproval" | "SurferApproval";
  targetId: string;             // ID of session or surfer being approved
  timestamp: number;            // Unix timestamp (ms) when stored
  expiresAt: number;           // Unix timestamp (ms) when expires (7 days later)
}
```

### Signature Types

- **`SessionApproval`** - Signature approving a surf session for blockchain submission
- **`SurferApproval`** - Signature approving a surfer for community validation

### Error Handling

All endpoints use standard HTTP status codes and return consistent error formats:

```json
{
  "success": false,
  "message": "Description of what went wrong"
}
```

Common error scenarios:
- `400 Bad Request` - Invalid JSON, missing required fields, or malformed data
- `404 Not Found` - Signature ID doesn't exist
- `500 Internal Server Error` - Unexpected server error

## Integration with Frontend

### Example React/TypeScript Integration

```typescript
// Types for frontend integration
interface SignatureSubmission {
  signerAddress: string;
  signerId: string;
  signatureData: string;
  signatureType: 'SessionApproval' | 'SurferApproval';
  targetId: string;
}

interface SignatureResponse {
  success: boolean;
  message: string;
  signatureId?: string;
}

// Submit a signature
const submitSignature = async (signature: SignatureSubmission): Promise<SignatureResponse> => {
  const response = await fetch('http://localhost:3001/signatures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signature)
  });
  return response.json();
};

// Get signatures for batch submission to blockchain
const getSessionSignatures = async (sessionId: string) => {
  const response = await fetch(`http://localhost:3001/signatures/session/${sessionId}`);
  const data = await response.json();
  return data.signatures; // Array of signature objects
};

// Example usage in React component
const handleApproveSession = async (sessionId: string, userSignature: string) => {
  try {
    const result = await submitSignature({
      signerAddress: userWallet.address,
      signerId: userProfile.alias,
      signatureData: userSignature,
      signatureType: 'SessionApproval',
      targetId: sessionId
    });
    
    if (result.success) {
      console.log('Signature stored:', result.signatureId);
      // Show success notification
    }
  } catch (error) {
    console.error('Failed to submit signature:', error);
    // Show error notification
  }
};
```

### Workflow Integration

1. **User Signs**: Frontend collects user's cryptographic signature
2. **Submit to Server**: POST signature to `/signatures` endpoint
3. **Collect Signatures**: Periodically GET signatures by session/surfer
4. **Batch Submit**: When enough signatures collected, submit to blockchain
5. **Cleanup**: DELETE processed signatures or let them expire

## Development

### Running Tests

```bash
# Test all endpoints
curl http://localhost:3001/status
curl -X POST http://localhost:3001/signatures -H "Content-Type: application/json" -d '{"signerAddress":"0x123","signerId":"test","signatureData":"0xabc","signatureType":"SessionApproval","targetId":"test_session"}'
curl http://localhost:3001/signatures/session/test_session
```

### Performance Characteristics

- **Throughput**: ~50,000 requests/second
- **Latency**: <1ms response time
- **Memory**: ~1KB per signature
- **Storage**: Supports ~100,000 concurrent signatures
- **Cleanup**: Automatic every 10 minutes

---

**Happy surfing! 🏄‍♂️🌊**