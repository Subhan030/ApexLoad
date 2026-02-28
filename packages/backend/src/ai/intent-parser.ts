import OpenAI from 'openai';
import { ParsedTestConfig } from '../types';

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

// System prompt engineered for consistent JSON output.
// Few-shot examples teach the LLM the exact format expected.
const PARSER_SYSTEM_PROMPT = `You are a load test configuration parser for ApexLoad.
Extract load test parameters from natural language and return ONLY a JSON object — no markdown, no explanation, just raw JSON.

JSON schema (all fields optional except confidence and rawIntent):
{
  "name": string,           // Short descriptive name for the test
  "url": string,            // Full URL including protocol
  "method": "GET"|"POST"|"PUT"|"DELETE"|"PATCH",
  "headers": object,        // Key-value pairs e.g. {"Authorization": "Bearer ..."}
  "body": string,           // JSON string for request body
  "concurrency": number,    // Number of parallel workers (default: 10)
  "totalRequests": number,  // Total requests to fire (default: 100)
  "rampUpSeconds": number,  // Gradual ramp-up period in seconds (default: 0)
  "timeoutMs": number,      // Per-request timeout in ms (default: 5000)
  "thinkTimeMs": number,    // Pause between requests per worker (default: 0)
  "confidence": number,     // 0.0–1.0: how confident you are in the parse
  "rawIntent": string       // Echo back the original user input verbatim
}

INFERENCE RULES:
- "concurrent users" / "virtual users" / "workers" → concurrency
- "requests" / "hits" / "calls" → totalRequests
- "ramp up over X seconds" → rampUpSeconds
- "soak test for X minutes" → totalRequests = concurrency * X * 60 / 10 (approximate)
- "stress test" → high concurrency (100+), high requests
- "smoke test" → low concurrency (1–5), low requests (10–50)
- "login" / "auth" endpoints → default to POST if method not specified
- If URL has no protocol, prepend https://
- Set confidence < 0.7 if URL is missing or ambiguous

EXAMPLES:
Input: "hammer my payment API at https://api.shop.com/checkout with 200 concurrent users, POST, 1000 total requests, ramp up 30 seconds"
Output: {"name":"Payment API Stress Test","url":"https://api.shop.com/checkout","method":"POST","concurrency":200,"totalRequests":1000,"rampUpSeconds":30,"timeoutMs":5000,"thinkTimeMs":0,"confidence":0.97,"rawIntent":"hammer my payment API..."}

Input: "quick smoke test on localhost:3000/health"
Output: {"name":"Health Endpoint Smoke Test","url":"http://localhost:3000/health","method":"GET","concurrency":2,"totalRequests":20,"rampUpSeconds":0,"timeoutMs":5000,"thinkTimeMs":0,"confidence":0.92,"rawIntent":"quick smoke test on localhost:3000/health"}`;

export async function parseTestIntent(userPrompt: string): Promise<ParsedTestConfig> {
    // Trim and sanitize input
    const sanitized = userPrompt.trim().slice(0, 500); // Cap at 500 chars

    const response = await client.chat.completions.create({
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
            { role: 'system', content: PARSER_SYSTEM_PROMPT },
            { role: 'user', content: sanitized }
        ]
    });

    const raw = response.choices?.[0]?.message?.content ?? '{}';

    // Safely strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

    let parsed: ParsedTestConfig;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        // Return a safe fallback if the LLM returns malformed JSON
        return {
            confidence: 0,
            rawIntent: sanitized,
        };
    }

    // Enforce safe numeric ranges — never trust LLM output blindly
    if (parsed.concurrency) parsed.concurrency = Math.min(Math.max(1, parsed.concurrency), 1000);
    if (parsed.totalRequests) parsed.totalRequests = Math.min(Math.max(1, parsed.totalRequests), 100_000);
    if (parsed.rampUpSeconds) parsed.rampUpSeconds = Math.min(Math.max(0, parsed.rampUpSeconds), 600);
    if (parsed.timeoutMs) parsed.timeoutMs = Math.min(Math.max(100, parsed.timeoutMs), 60_000);
    if (parsed.thinkTimeMs) parsed.thinkTimeMs = Math.min(Math.max(0, parsed.thinkTimeMs), 10_000);

    return parsed;
}
