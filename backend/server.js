import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { performance } from "perf_hooks";
import { execFile } from "child_process";

function extractImages(pdfPath, outputDir = "uploads/tmp_images") {
    return new Promise((resolve, reject) => {
        execFile("python", ["extract_images.py", pdfPath, outputDir], (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(JSON.parse(stdout)); // supponendo che lo script Python ritorni JSON
        });
    });
}
function replacePlaceholders(html, images) {
    let output = html;
    images.forEach((img, index) => {
        const placeholder = `[IMAGE_${index + 1}]`;
        if (output.includes(placeholder)) {
            const imgTag = `<img class="img_pdf" src="data:image/${img.ext};base64,${fs.readFileSync(img.path).toString("base64")}" alt="image_${index + 1}" />`;
            output = output.replaceAll(placeholder, imgTag);
        }
    });
    return output;
}


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

        //costruzione del corpo della richiesta: prompt + pdf inline
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
        log("Risposta ricevuta");
        const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // estrazione e sostituzione placeholder immagini dal PDF
        const images = await extractImages(filePath);
        const htmlWithImages = replacePlaceholders(htmlContent, images);

        //ritorno risposta al client
        res.json({ html: htmlWithImages, images });
    } catch (err) {
        console.error("Errore backend:", err);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: err.message });
    }finally{
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend avviato su http://localhost:${PORT}`));
