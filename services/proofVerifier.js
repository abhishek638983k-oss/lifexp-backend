const MAX_PROOF_BYTES = 800 * 1024;
const { verifyChallengeProofWithGemini } = require("./geminiService");

const parseProofImage = (proofImageDataUrl) => {
    if (!proofImageDataUrl) {
        return { valid: false, message: "Upload a proof photo before completing." };
    }

    const match = proofImageDataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/);

    if (!match) {
        return { valid: false, message: "Proof must be a PNG, JPG, JPEG, or WEBP image." };
    }

    const bytes = Buffer.from(match[2], "base64");

    if (bytes.length < 1500) {
        return { valid: false, message: "Proof image is too small or empty." };
    }

    if (bytes.length > MAX_PROOF_BYTES) {
        return { valid: false, message: "Proof image is too large. Keep it under 800KB." };
    }

    return {
        valid: true,
        mimeType: match[1],
        size: bytes.length,
        bytes,
        dataUrl: proofImageDataUrl
    };
};

const verifyProofImage = async ({ challenge, proofImageDataUrl, proofNote = "" }) => {
    const parsed = parseProofImage(proofImageDataUrl);

    if (!parsed.valid) {
        return {
            accepted: false,
            status: "rejected",
            score: 0,
            feedback: parsed.message
        };
    }

    if (process.env.GEMINI_API_KEY) {
        try {
            const gemini = await verifyChallengeProofWithGemini({
                challenge,
                proofImage: parsed,
                proofNote
            });

            if (gemini) {
                return {
                    accepted: gemini.accepted,
                    status: gemini.accepted ? "approved" : "manual_review",
                    score: gemini.score,
                    feedback: gemini.accepted
                        ? `Gemini accepted proof: ${gemini.feedback}`
                        : `Gemini needs review: ${gemini.feedback}`,
                    image: parsed
                };
            }
        } catch (err) {
            // Fall through to Hugging Face or manual review.
        }
    }

    if (!process.env.HUGGINGFACE_API_TOKEN) {
        return {
            accepted: false,
            status: "manual_review",
            score: 0.5,
            feedback: "Photo received. Waiting for admin review.",
            image: parsed
        };
    }

    try {
        const labels = [
            challenge.title,
            `${challenge.category} task proof`,
            "completed task proof",
            "unrelated photo"
        ];

        const response = await fetch(
            "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: proofImageDataUrl,
                    parameters: { candidate_labels: labels }
                })
            }
        );

        if (!response.ok) {
            throw new Error("AI verifier unavailable");
        }

        const result = await response.json();
        const scores = Array.isArray(result) ? result : [];
        const best = scores[0] || {};
        const unrelated = scores.find(item => item.label === "unrelated photo");
        const score = Number(best.score || 0);
        const unrelatedScore = Number(unrelated?.score || 0);
        const accepted = score >= 0.55 && best.label !== "unrelated photo" && unrelatedScore < 0.6;

        return {
            accepted,
            status: accepted ? "approved" : "manual_review",
            score,
            feedback: accepted
                ? `AI accepted proof as ${best.label}.`
                : "AI could not confidently verify the photo. Waiting for admin review.",
            image: parsed
        };
    } catch (err) {
        return {
            accepted: false,
            status: "manual_review",
            score: 0.5,
            feedback: "Photo received. AI verifier unavailable, waiting for admin review.",
            image: parsed
        };
    }
};

module.exports = { verifyProofImage };
