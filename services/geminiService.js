const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const FALLBACK_GEMINI_MODEL = "gemini-2.5-flash";

const parseGeminiJson = (text) => {
    const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

const geminiModels = () => {
    const configured = process.env.GEMINI_MODEL?.trim();
    return [...new Set([configured, DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODEL].filter(Boolean))];
};

const callGemini = async ({ prompt, image }) => {
    if (!process.env.GEMINI_API_KEY) {
        return null;
    }

    const parts = [{ text: prompt }];

    if (image?.base64 && image?.mimeType) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.base64
            }
        });
    }

    const body = JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
        }
    });

    const errors = [];

    for (const model of geminiModels()) {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },
                body
            }
        );

        if (!response.ok) {
            const text = await response.text();
            errors.push(`${model}: ${response.status} ${text.slice(0, 160)}`);
            continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        return parseGeminiJson(text || "");
    }

    throw new Error(`Gemini request failed. ${errors.join(" | ")}`);
};

const verifyChallengeProofWithGemini = async ({ challenge, proofImage, proofNote }) => {
    const base64 = proofImage.dataUrl.split(",")[1];
    const prompt = `
You are checking proof for a gamified real-life challenge app.
Challenge title: ${challenge.title}
Category: ${challenge.category}
Difficulty: ${challenge.difficulty}
User note: ${proofNote || "No note"}

Look at the image and decide if it plausibly proves the user attempted or completed the challenge.
Be strict with unrelated photos, blank photos, screenshots that do not show work, and obvious cheating.
Return only JSON with:
{
  "accepted": boolean,
  "confidence": number between 0 and 1,
  "reason": "short explanation"
}
`;

    const result = await callGemini({
        prompt,
        image: {
            mimeType: proofImage.mimeType,
            base64
        }
    });

    if (!result) return null;

    return {
        accepted: Boolean(result.accepted) && Number(result.confidence || 0) >= 0.7,
        score: Number(result.confidence || 0),
        feedback: result.reason || "Gemini reviewed the proof."
    };
};

const generateChallengeIdeas = async ({ category = "coding", difficulty = "easy", count = 5 }) => {
    const prompt = `
Generate ${count} practical LifeXP challenges.
Category: ${category}
Difficulty: ${difficulty}
Return only JSON:
{
  "challenges": [
    {
      "title": "short action title",
      "description": "clear completion criteria",
      "estimatedMinutes": 10
    }
  ]
}
`;

    const result = await callGemini({ prompt });
    return Array.isArray(result?.challenges) ? result.challenges : [];
};

module.exports = {
    verifyChallengeProofWithGemini,
    generateChallengeIdeas
};
