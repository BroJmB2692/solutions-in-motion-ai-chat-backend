import OpenAI from "openai";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // --- CORS HEADERS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    // Load JSON safely using fs
    const filePath = path.join(process.cwd(), "data", "business.json");
    const businessData = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are the official AI assistant for Solutions In Motion.

Your ONLY purpose is to answer questions about:
- Solutions In Motion services
- pricing
- workflows
- onboarding
- support
- scheduling
- client use cases
- technical capabilities
- business information provided below

STRICT RULES:
1. You must ONLY answer using Solutions In Motion content.
2. You may ONLY use the business data provided below.
3. If the user asks about anything unrelated, politely redirect them back to Solutions In Motion.
4. Never invent services, pricing, or capabilities that were not provided.
5. Keep your tone confident, warm, modern, and concise.

BUSINESS CONTENT (JSON):
${JSON.stringify(businessData)}
`
        },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
