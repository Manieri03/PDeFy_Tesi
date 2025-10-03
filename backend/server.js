import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";
import { performance } from "perf_hooks";

dotenv.config();
const app = express();

//directory momentanea che contiene i file prima dell'elebaorazione, verrà poi pulita
const upload = multer({ dest: "uploads/" });
const pdfExtract = new PDFExtract();

function makeTimer(label = "TIMER") {
    const start = performance.now();
    return (checkpoint) => {
        const now = performance.now();
        const elapsed = (now - start).toFixed(2);
        console.log(`[${label}] ${checkpoint} +${elapsed}ms`);
    };
}

//API Key di Gemini
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.error("GEMINI_API_KEY non trovata nel file .env");
    process.exit(1);
}

//middleware per parsing del corpo della richiesta
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/api/generate", upload.single("file"), async (req, res) => {
    const logTime = makeTimer("Cronometro");
    let filePath = null;

    try {
        logTime("Inizio richiesta");

        // Multer mette i campi text in req.body
        const prompt = req.body.prompt;

        //console.log("Prompt ricevuto:", prompt);
        //console.log("File ricevuto:", req.file);
        //console.log("Body completo:", req.body);


        if (!prompt) {
            return res.status(400).json({ error: "Prompt mancante" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Nessun file PDF caricato" });
        }

        filePath = req.file.path;
        logTime("File ricevuto");

        // Estrazione testo dal PDF tramite PDFEstract
        const data = await pdfExtract.extract(filePath);
        logTime("PDF estratto");

        const extractedText = data.pages
            .map(page => page.content.map(item => item.str).join(" "))
            .join("\n");
        logTime("Testo concatenato");
        console.log(`Estratte ${data.pages.length} pagine (${extractedText.length} caratteri)`);

        // Limita il testo se troppo lungo
        const maxChars = 30000;
        const finalText = extractedText.length > maxChars
            ? extractedText.substring(0, maxChars) + "\n\n...Testo troncato..."
            : extractedText;

        const outputPath = "outputs/finalText.txt";

        //crea la cartella se non esiste
        if (!fs.existsSync("outputs")) {
            fs.mkdirSync("outputs");
        }
        fs.writeFileSync(outputPath, finalText, "utf-8");
        logTime("FinalText salvato");

        //Costruzionde della request combinando prompt e pdf
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `PROMPT UTENTE: ${prompt}` },
                        { text: `CONTENUTO DEL PDF:\n${finalText}` },
                    ],
                },
            ]
        };
        logTime("Request body costruito");


        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        logTime("Chiamata API completata");

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Errore Gemini:", errorText);
            throw new Error(`Errore API Gemini: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        logTime("Risposta Gemini ricevuta");

        // Pulizia file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json(result);
        logTime("Risposta inviata al client");

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