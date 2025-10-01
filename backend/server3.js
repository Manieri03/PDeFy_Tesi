import express from "express";
import multer from "multer";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });
const pdfExtract = new PDFExtract();

const API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!API_KEY) {
    console.error("HUGGINGFACE_API_KEY non trovata nel file .env");
    process.exit(1);
}

const hf = new HfInference(API_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/generate", upload.single("file"), async (req, res) => {
    let filePath = null;

    try {
        const prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: "Prompt mancante" });
        if (!req.file) return res.status(400).json({ error: "Nessun file PDF caricato" });

        filePath = req.file.path;

        const data = await pdfExtract.extract(filePath);
        const extractedText = data.pages
            .map(page => page.content.map(item => item.str).join(" "))
            .join("\n");

        const maxChars = 30000;
        const finalText = extractedText.length > maxChars
            ? extractedText.substring(0, maxChars) + "\n\n...Testo troncato..."
            : extractedText;

        const fullPrompt = `PROMPT UTENTE: ${prompt}\n\nCONTENUTO DEL PDF:\n${finalText}`;

        const output = await hf.textGeneration({
            model: "EleutherAI/gpt-neo-2.7B",
            inputs: fullPrompt,
            parameters: { max_new_tokens: 200 }
        });

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ generated: output[0].generated_text });

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: error.message || "Errore interno del server" });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Backend Hugging Face avviato su http://localhost:${PORT}`);
});
