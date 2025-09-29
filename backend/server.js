import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
const API_KEY = process.env.GEMINI_API_KEY;
app.post("/api/generate", async (req, res) => {
    try {
        const {prompt} = req.body;
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            method: "POST",
            headers: {"Content-Type": "application/json", "X-goog-api-key": API_KEY,},
            body: JSON.stringify({contents: [{parts: [{text: prompt}]}],}),
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});
app.listen(5000, () => console.log("Backend avviato su http://localhost:5000"));