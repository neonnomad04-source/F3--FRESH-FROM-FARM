// F3: AI Routes — Groq API proxy (keeps API key server-side)
import express from 'express';

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Generic Groq proxy — client sends { prompt, model? }
router.post('/groq', async (req, res) => {
    const { prompt, model = "llama-3.3-70b-versatile", jsonMode = true } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: model === "llama-3.3-70b-versatile" ? "llama-3.1-8b-instant" : model,
                max_tokens: 1500,
                ...(jsonMode && { response_format: { type: "json_object" } }),
                messages: [
                    { role: "system", content: jsonMode ? "You output concise JSON strictly. Be brief but accurate." : "You are a helpful agricultural assistant." },
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Groq API error:', err);
            return res.status(response.status).json({ error: 'Groq API error', details: err });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) return res.status(500).json({ error: 'Empty response from Groq' });

        if (jsonMode) {
            try {
                // Try direct parse first
                res.json({ result: JSON.parse(content) });
            } catch (e) {
                // Fallback: Extract JSON from markdown or text blocks
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        res.json({ result: JSON.parse(jsonMatch[0]) });
                    } catch (e2) {
                        res.status(500).json({ error: 'AI returned invalid JSON structure', details: content });
                    }
                } else {
                    res.status(500).json({ error: 'AI did not return a JSON object', details: content });
                }
            }
        } else {
            res.json({ result: content });
        }

    } catch (err) {
        console.error('AI route error:', err);
        res.status(500).json({ error: 'AI processing failed', message: err.message });
    }
});

export default router;
