// src/api-integrations/chatbotApi.ts

export async function fetchChatbotResponse(question: string): Promise<string> {
  try {
    const res = await fetch("https://n8n.srv880406.hstgr.cloud/webhook/18543cff-f795-4d75-a9d3-991914f6e84c", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (data && data.answer) return data.answer;
    if (typeof data === "string") return data;
    return JSON.stringify(data);
  } catch (err) {
    return "Sorry, I couldn't reach the assistant service.";
  }
}
