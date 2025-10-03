import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { performance } from "perf_hooks";
import { GoogleGenAI } from "@google/genai";


dotenv.config();
const app = express();
// Multer per gestire il file temporaneo
const upload = multer({ dest: "uploads/" });

function makeTimer(label = "TIMER") {
    const start = performance.now();
    return (checkpoint) => {
        const now = performance.now();
        const elapsed = (now - start).toFixed(2);
        console.log(`[${label}] ${checkpoint} +${elapsed}ms`);
    };
}
//lettura automatica della key dal .env
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("GEMINI_API_KEY non trovata nel file .env");
    process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

//middleware per parsing del corpo della richiesta
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/generate", upload.single("file"), async (req, res) => {
    const logTime = makeTimer("Cronometro");
    let filePath = null;
    let fileResource = null; // Riferimento al file caricato su Gemini

    try {
        logTime("Inizio richiesta");

        const prompt = req.body.prompt;

        if (!prompt || !req.file ) {
            return res.status(400).json({ error: "Prompt o pdf mancante" });
        }

        logTime("File ricevuto");

        //console.log(req.file.mimetype);
        console.log(req.file)

        // L'SDK gestisce la lettura del file binario e l'upload all'endpoint files/
        fileResource = await ai.files.upload({
            file: req.file.path,
            mimeType: req.file.mimetype,
            displayName: req.file.originalname,
        });

        logTime(`File caricato su Gemini: ${fileResource.name}`);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `PROMPT UTENTE: ${prompt}` },
                        {
                            fileData: {
                                mimeType: req.file.mimetype,
                                fileUri: fileResource.name,
                            },
                        },
                    ],
                },
            ],
            //...
        });

        logTime("Risposta Gemini ricevuta");
        const resultText = response.response.text; // Estrai il testo della risposta

        // Pulizia file locale
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logTime("File locale eliminato");
        }
        // Pulizia file da Gemini
        if (fileResource) {
            await ai.files.delete({ name: fileResource.name });
            logTime("File rimosso da Gemini");
        }

        // Risposta al client
        res.json({ text: resultText, fullResponse: response });
        logTime("Risposta inviata al client");

    } catch (error) {
        console.error("Errore nel backend:", error);

        // Pulizia file locale in caso di errore
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.error("Errore nella pulizia del file locale:", e);
            }
        }

        // Pulizia file su Gemini in caso di errore
        if (fileResource) {
            try {
                await ai.files.delete({ name: fileResource.name });
                console.log("File rimosso da Gemini dopo l'errore.");
            } catch (e) {
                console.error("Errore nella pulizia del file da Gemini:", e);
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