import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { performance } from "perf_hooks";
import pdfParse from "pdf-parse";

dotenv.config();
const app = express();

//parser di multipart/form-data
const upload = multer({ dest: "uploads/" });

//controllo key gemini
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("GEMINI_API_KEY non trovata nel file .env");
    process.exit(1);
}

//middleware per parsing del corpo della richiesta
app.use(express.json());

//timer per debug
function makeTimer(label = "TIMER") {
    const start = performance.now();
    return (msg) => {
        const elapsed = (performance.now() - start).toFixed(2);
        console.log(`[${label}] ${msg} +${elapsed}ms`);
    };
}

async function extractImagesFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const images = [];

    try {
        // Cerca marker JPEG nel PDF
        const startMarker = Buffer.from([0xFF, 0xD8]); // JPEG start
        const endMarker = Buffer.from([0xFF, 0xD9]); // JPEG end

        let pos = 0;
        let imgIndex = 0;

        while (pos < dataBuffer.length) {
            // Trova inizio JPEG
            const startPos = dataBuffer.indexOf(startMarker, pos);
            if (startPos === -1) break;

            // Trova fine JPEG
            const endPos = dataBuffer.indexOf(endMarker, startPos + 2);
            if (endPos === -1) break;

            // Estrai l'immagine completa (incluso end marker)
            const imageBuffer = dataBuffer.slice(startPos, endPos + 2);

            // Verifica che sia una JPEG valida (dimensione minima ragionevole)
            if (imageBuffer.length > 100) {
                const base64 = imageBuffer.toString('base64');
                images.push({
                    index: imgIndex++,
                    type: 'jpeg',
                    base64: `data:image/jpeg;base64,${base64}`,
                    size: imageBuffer.length
                });
                console.log(`Trovata immagine ${imgIndex}: ${imageBuffer.length} bytes`);
            }

            pos = endPos + 2;
        }

        console.log(`Totale immagini estratte: ${images.length}`);

    } catch (err) {
        console.error("Errore estrazione immagini:", err);
    }

    return images;
}

// endpoint POST /api/generate
app.post("/api/generate", upload.single("file"), async (req, res) => {
    const log = makeTimer("Gemini PDF");
    let filePath = null;

    try {
        log("Inizio richiesta");
        const { prompt } = req.body;

        //validazione prompt e file pdf
        if (!prompt) return res.status(400).json({ error: "Prompt mancante" });
        if (!req.file) return res.status(400).json({ error: "Nessun file PDF caricato" });
        filePath = req.file.path;

        //lettura del file
        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");
        const extractedImages = extractImagesFromPDF(filePath);

        //costruzionde del corpo della richiesta: prompt + pdf inline
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        //parti della richiesta, prompt + pdf inline
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64File,
                                mimeType: "application/pdf",
                            },
                        },
                    ],
                },
            ],
        };

        log("Body costruito, invio a Gemini...");

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errTxt = await response.text();
            console.error("Errore Gemini:", errTxt);
            throw new Error(`Errore API Gemini: ${response.status} - ${errTxt}`);
        }

        //parsing della risposta ricevuta dal modello
        const data = await response.json();

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Sostituisci i placeholder [IMAGE_X] con le immagini estratte in base64
        text = text.replace(/\[IMAGE_(\d+)\]/g, (match, imgIndex) => {
            const index = parseInt(imgIndex);
            const img = extractedImages[index];
            if (img) {
                return `<img src="${img.base64}" alt="Immagine ${index + 1}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
            }
            return `<!-- Immagine ${index} non trovata -->`;
        });

        log("Risposta ricevuta");

        data.candidates[0].content.parts[0].text = text;

        // Pulizia
        fs.unlinkSync(filePath);
        //ritorno risposta al client
        res.json(data);
    } catch (err) {
        console.error("Errore backend:", err);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend avviato su http://localhost:${PORT}`));
