import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";

const app = express();
const upload = multer({ dest: "uploads/" });
const pdfExtract = new PDFExtract();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/mistral", upload.single("file"), async (req, res) => {
    let filePath = null;

    try {
        const prompt = req.body.prompt;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt mancante" });
        }
        if (!req.file) {
            return res.status(400).json({ error: "Nessun file PDF caricato" });
        }

        filePath = req.file.path;

        // Estrazione testo dal PDF
        const data = await pdfExtract.extract(filePath);
        const extractedText = data.pages
            .map(page => page.content.map(item => item.str).join(" "))
            .join("\n");

        const maxChars = 30000;
        const finalText = extractedText.length > maxChars
            ? extractedText.substring(0, maxChars) + "\n\n...Testo troncato..."
            : extractedText;

        const combinedPrompt = `
PROMPT UTENTE:
${prompt}

CONTENUTO DEL PDF:
${finalText}
        `;

        const response = await fetch("http://127.0.0.1:50197/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "Mistral-7B-Instruct-v0.3", // nome esatto dal log
                prompt: combinedPrompt,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Errore Ollama: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ text: result.response });

    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: error.message || "Errore interno" });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Server2 (Mistral locale) su http://localhost:${PORT}`);
});
