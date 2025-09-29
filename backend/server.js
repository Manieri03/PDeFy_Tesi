import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });
const pdfExtract = new PDFExtract();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("GEMINI_API_KEY non trovata nel file .env");
    process.exit(1);
}

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/generate", upload.single("file"), async (req, res) => {
    let filePath = null;

    try {
        // Multer mette i campi text in req.body
        const prompt = req.body.prompt;

        console.log("Prompt ricevuto:", prompt);
        console.log("File ricevuto:", req.file);
        console.log("Body completo:", req.body);

        if (!prompt) {
            return res.status(400).json({ error: "Prompt mancante" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Nessun file PDF caricato" });
        }

        filePath = req.file.path;

        // Estrazione testo dal PDF
        console.log("Estrazione testo dal PDF...");
        const data = await pdfExtract.extract(filePath);
        const extractedText = data.pages
            .map(page => page.content.map(item => item.str).join(" "))
            .join("\n");

        console.log(`Estratte ${data.pages.length} pagine (${extractedText.length} caratteri)`);

        // Limita il testo se troppo lungo
        const maxChars = 30000;
        const finalText = extractedText.length > maxChars
            ? extractedText.substring(0, maxChars) + "\n\n[Testo troncato...]"
            : extractedText;

        // Invio a Gemini
        console.log("Invio richiesta a Gemini");

        const bodyTextForGemini =
            `
            Non risolvere esercizi, mantieni tutto come contenuto.
            PROMPT UTENTE: ${req.body.prompt}
            CONTENUTO DEL PDF:
            ${finalText}
            `;

        const requestBody = {
            systemInstruction: "Sei un web developer esperto. La tua UNICA risposta deve essere una pagina HTML completa e ben strutturata (inizia con <!DOCTYPE html> e finisce con </html>). NON includere testo esplicativo, commenti o blocchi di codice markdown (es. ```html).",
            contents: [
                {
                    role: "user",
                    parts: [{ text: bodyTextForGemini }],
                },
            ],
            config: {
                temperature: 0.8,
                candidateCount: 1,
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Errore Gemini:", errorText);
            throw new Error(`Errore API Gemini: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log("Risposta ricevuta da Gemini");

        // Pulizia file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json(result);

    } catch (error) {
        console.error("Errore nel backend:", error);

        // Pulizia file in caso di errore
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error("Errore nella pulizia del file:", e);
            }
        }

        res.status(500).json({
            error: error.message || "Errore interno del server"
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend avviato su http://localhost:${PORT}`);
});