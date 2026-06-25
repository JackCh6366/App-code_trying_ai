import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKeyStatus = process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING";
  return res.json({
    status: "ok",
    apiKeyStatus,
    timestamp: new Date().toISOString(),
  });
}
