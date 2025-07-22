import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// Data structures
interface Signature {
  id: string;
  signerAddress: string;
  signerId: string;
  signatureData: string;
  signatureType: "SessionApproval" | "SurferApproval";
  targetId: string; // session_id or surfer_id
  timestamp: number;
  expiresAt: number;
}

interface SubmitSignatureRequest {
  signerAddress: string;
  signerId: string;
  signatureData: string;
  signatureType: "SessionApproval" | "SurferApproval";
  targetId: string;
}

interface SignatureResponse {
  success: boolean;
  message: string;
  signatureId?: string;
}

interface GetSignaturesResponse {
  signatures: Signature[];
  count: number;
}

// In-memory storage (you could replace this with Redis or a database)
const storage = new Map<string, Signature>();

// Helper function to add CORS headers
function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Helper function to check if signature is expired
function isExpired(signature: Signature): boolean {
  return Date.now() > signature.expiresAt;
}

// Background cleanup task
function startCleanupTask() {
  setInterval(() => {
    const expiredKeys: string[] = [];
    
    for (const [key, signature] of storage.entries()) {
      if (isExpired(signature)) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      storage.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired signatures`);
    }
  }, 10 * 60 * 1000); // Run every 10 minutes
}

// Route handlers
async function submitSignature(request: Request): Promise<Response> {
  try {
    const body: SubmitSignatureRequest = await request.json();
    
    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days from now
    const signatureId = `sig_${body.targetId}_${now}`;

    const signature: Signature = {
      id: signatureId,
      signerAddress: body.signerAddress,
      signerId: body.signerId,
      signatureData: body.signatureData,
      signatureType: body.signatureType,
      targetId: body.targetId,
      timestamp: now,
      expiresAt,
    };

    storage.set(signatureId, signature);

    const response: SignatureResponse = {
      success: true,
      message: "Signature stored successfully",
      signatureId,
    };

    const res = new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(res);
  } catch (error) {
    const res = new Response(
      JSON.stringify({ success: false, message: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    return addCorsHeaders(res);
  }
}

function getSignaturesBySession(sessionId: string): Response {
  const signatures = Array.from(storage.values()).filter(
    (sig) =>
      sig.targetId === sessionId &&
      sig.signatureType === "SessionApproval" &&
      !isExpired(sig)
  );

  const response: GetSignaturesResponse = {
    signatures,
    count: signatures.length,
  };

  const res = new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
  return addCorsHeaders(res);
}

function getSignaturesBySurfer(surferId: string): Response {
  const signatures = Array.from(storage.values()).filter(
    (sig) =>
      sig.targetId === surferId &&
      sig.signatureType === "SurferApproval" &&
      !isExpired(sig)
  );

  const response: GetSignaturesResponse = {
    signatures,
    count: signatures.length,
  };

  const res = new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
  return addCorsHeaders(res);
}

function deleteSignature(signatureId: string): Response {
  const deleted = storage.delete(signatureId);
  
  const response: SignatureResponse = {
    success: deleted,
    message: deleted ? "Signature deleted successfully" : "Signature not found",
    signatureId: deleted ? signatureId : undefined,
  };

  const res = new Response(JSON.stringify(response), {
    status: deleted ? 200 : 404,
    headers: { "Content-Type": "application/json" },
  });
  return addCorsHeaders(res);
}

// Main request handler
async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  console.log(`${method} ${path}`);

  // Handle CORS preflight requests
  if (method === "OPTIONS") {
    const res = new Response(null, { status: 200 });
    return addCorsHeaders(res);
  }

  // Status check
  if (path === "/status" && method === "GET") {
    const res = new Response(JSON.stringify({ 
      status: "ok", 
      signatures: storage.size,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" },
    });
    return addCorsHeaders(res);
  }

  // Submit signature
  if (path === "/signatures" && method === "POST") {
    return await submitSignature(request);
  }

  // Get signatures by session
  const sessionMatch = path.match(/^\/signatures\/session\/(.+)$/);
  if (sessionMatch && method === "GET") {
    return getSignaturesBySession(sessionMatch[1]);
  }

  // Get signatures by surfer
  const surferMatch = path.match(/^\/signatures\/surfer\/(.+)$/);
  if (surferMatch && method === "GET") {
    return getSignaturesBySurfer(surferMatch[1]);
  }

  // Delete signature
  const deleteMatch = path.match(/^\/signatures\/(.+)$/);
  if (deleteMatch && method === "DELETE") {
    return deleteSignature(deleteMatch[1]);
  }

  // 404 for unknown routes
  const res = new Response("Not Found", { status: 404 });
  return addCorsHeaders(res);
}

// Start the server
console.log("Surf Signature Server starting on http://localhost:3001");
console.log("Available endpoints:");
console.log("  GET  /status");
console.log("  POST /signatures");
console.log("  GET  /signatures/session/{sessionId}");
console.log("  GET  /signatures/surfer/{surferId}");
console.log("  DELETE /signatures/{signatureId}");

// Start cleanup task
startCleanupTask();
  
// Bun server export (this is the only real change!)
export default {
  port: 3001,
  fetch: handler,
};