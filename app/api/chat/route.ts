import { NextRequest, NextResponse } from "next/server";
import { destinations, faqs } from "../../travel-data";
import { events } from "../../companion-data";

const context = destinations.map(d => `${d.name} (${d.region}): ${d.intro} Tip: ${d.tip}${d.caution ? ` Caution: ${d.caution}` : ""}`).join("\n");
const faqContext = faqs.map(f => `${f.q} ${f.a}`).join("\n");

function offlineAnswer(question: string) {
  const q = question.toLowerCase();
  const destination = destinations.find(d => q.includes(d.name.toLowerCase().split(" ")[0]) || d.activities.some(a => q.includes(a.name.toLowerCase())));
  const faq = faqs.find(f => f.q.toLowerCase().split(" ").filter(w => w.length > 4).some(w => q.includes(w)));
  if (destination) return `${destination.name} is a strong choice for ${destination.bestFor.slice(0,3).join(", ").toLowerCase()}. ${destination.intro} ${destination.tip}${destination.caution ? ` Important: ${destination.caution}` : ""}`;
  if (faq) return faq.a;
  if (q.includes("event") || q.includes("festival")) return `Quetzal currently tracks ${events.length} annual and verified cultural dates. Add your travel dates in My route and the planner will surface events that overlap your trip. Reconfirm annual programs locally before making a special journey.`;
  return "I can help with routes, destinations, transport, food, Spanish phrases, events and seasonal planning in Guatemala. Try asking “What should I do in Antigua for two days?” or “Which route works best in November?”";
}

export async function POST(request: NextRequest) {
  const { message, route = [], dates = "" } = await request.json();
  if (!message || typeof message !== "string") return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ answer: offlineAnswer(message), mode: "curated" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        max_output_tokens: 500,
        reasoning: { effort: "low" },
        input: [
          { role: "developer", content: [{ type: "input_text", text: `You are Quetzal, a concise Guatemala travel companion. Use the curated context below. Never invent current opening hours, prices, safety conditions, entry rules or weather. Distinguish annual events from confirmed editions. For health, safety, volcanoes and borders, recommend checking official current guidance. Keep answers under 160 words and practical.\n\nDESTINATIONS\n${context}\n\nFAQ\n${faqContext}` }] },
          { role: "user", content: [{ type: "input_text", text: `Question: ${message}\nSaved route: ${route.join(", ") || "none"}\nTrip dates: ${dates || "not set"}` }] },
        ],
      }),
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    const answer = data.output_text || data.output?.flatMap((item: {content?: {type?: string;text?: string}[]}) => item.content || []).find((item: {type?: string}) => item.type === "output_text")?.text;
    return NextResponse.json({ answer: answer || offlineAnswer(message), mode: "ai" });
  } catch {
    return NextResponse.json({ answer: offlineAnswer(message), mode: "curated" });
  }
}
