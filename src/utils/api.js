// src/utils/api.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_GEMINI_KEY);
const groq = new Groq({
  apiKey: import.meta.env.VITE_API_GROQ_KEY,
  dangerouslyAllowBrowser: true
});

// ――― Style guidelines remain unchanged ―――
const STYLE_GUIDELINES = `
You are a helpful AI assistant that formats all your answers beautifully in Markdown.

• 🎯 Use big section headers with relevant emojis (e.g., 🎯, 🚀, 📚, 🛠️).
• ✅ Use ✅ or ➡️ for ordered steps or checklist items.
• ⚡ Highlight tips with ⚡ or 💡.
• ⚠️ Show warnings or important notes with ⚠️ or ❗.
• 📌 Use 📌 when mentioning important points or summaries.
• 🚫 For errors or restrictions, use 🚫 or ❌.
• ✏️ For code-related instructions, use ✏️ or 🧠.
• 🎨 Feel free to use bold (**text**) and italics (*text*) for emphasis.
• ℹ️ Provide useful info with ℹ️ when explaining concepts.
• ⏳ If something is time-based, use ⏳ or ⏱️.
• Use bullet points (•) or checkmarks for clean lists.

👉 Keep all code blocks clean without adding emojis inside code.

Render everything cleanly and naturally in Markdown!
`;

export const generateGeminiResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${STYLE_GUIDELINES}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return await result.response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "⚠️ Gemini response failed";
  }
};

// Simplified Groq implementation
export const generateLlamaResponse = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: `${STYLE_GUIDELINES}\n\n${prompt}`
      }]
    });

    return completion.choices[0]?.message?.content || "⚠️ No response generated";
  } catch (error) {
    console.error("Groq API error:", error);
    return `⚠️ Llama-3 Error: ${error.message}`;
  }
};