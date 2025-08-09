exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;


    const { prompt } = JSON.parse(event.body);

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 200 },
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        // Log full raw response
        console.log("🔍 Gemini RAW response:", JSON.stringify(data, null, 2));

        // Try to extract the actual text safely
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Gemini response missing expected content' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ rawText }) // You can parse this JSON in frontend
        };

    } catch (error) {
        console.error("❌ Fetch error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch or parse Gemini response' })
        };
    }
};