const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Parse JSON requests
app.use(require("cors")()); // Allow CORS

// OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// YouTube API
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Route: Handle user prompt
app.post("/api/prompt", async (req, res) => {
    const { prompt } = req.body;

    try {
        // Step 1: Get GPT response
        const gptResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo", // Or "gpt-4"
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
            }
        );

        const gptAnswer = gptResponse.data.choices[0].message.content;

        // Step 2: Search YouTube for relevant videos
        const youtubeResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/search`,
            {
                params: {
                    part: "snippet",
                    q: prompt,
                    type: "video",
                    key: YOUTUBE_API_KEY,
                },
            }
        );

        const videos = youtubeResponse.data.items.map((item) => ({
            title: item.snippet.title,
            description: item.snippet.description,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        }));

        // Step 3: Send the GPT response and videos to the client
        res.json({
            gptAnswer,
            videos,
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "An error occurred." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
