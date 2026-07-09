export const OPENROUTER_API_KEY = "sk-or-v1-REDACTED";
export const AI_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export async function generateAIResponse(prompt: string, systemPrompt?: string) {
  try {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("AI Request failed", response.status, errorData);
      return "Error: AI Node request failed. Please check credentials or API constraints.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "AI generation resulted in an empty response.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Error: AI Node is offline or unreachable.";
  }
}

export async function polishText(text: string) {
  const prompt = `Rewrite the following text to be highly professional, polished, engaging, and clear. Correct any grammar mistakes. Only return the rewritten text, nothing else (no introductory text like 'Here is the rewrite:').\n\nText: ${text}`;
  return generateAIResponse(prompt);
}

export async function summarizeChat(messages: {sender: string, text: string}[]) {
  const history = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `Provide a concise, professional summary of the following chat history. Highlight the main topics discussed, key decisions made, and any action items. Format it nicely with markdown.\n\nChat History:\n${history}`;
  return generateAIResponse(prompt, "You are a professional AI secretary. Provide highly accurate and useful conversation summaries.");
}

export async function translateMessage(text: string, targetLang: string) {
  const prompt = `Translate the following text to ${targetLang}. Only return the translated text, nothing else (no explanations, no quotes).\n\nText: ${text}`;
  return generateAIResponse(prompt, `You are a professional translator. Translate accurately to ${targetLang}.`);
}

export async function detectLanguage(text: string) {
  const prompt = `Detect the language of the following text. Only return the language name (e.g., "Spanish", "French", "English"), nothing else.\n\nText: ${text}`;
  return generateAIResponse(prompt, "You are a language detection expert. Return only the language name.");
}
