const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

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

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        throw new Error("Gemini verifier unavailable");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    return parseGeminiJson(text || "");
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
