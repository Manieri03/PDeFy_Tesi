#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";
import { HTML_PROMPT } from "../html_prompt.js"
import { fileURLToPath } from "url";

dotenv.config();
const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PY_EXTRACT_IMAGES = path.resolve(__dirname, "../extract_images.py");
const PY_EXTRACT_LAYOUT = path.resolve(__dirname, "../extract_layout_JSON.py");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY non trovata nel file .env");
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";

async function extractImages(pdfPath, outputDir) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const { stdout } = await execFileAsync("python", [
        PY_EXTRACT_IMAGES,
        pdfPath,
        outputDir
    ]);
    return JSON.parse(stdout);
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

async function processPdfInline(pdfPath, prompt) {
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64File = fileBuffer.toString("base64");

    const images = await extractImages(pdfPath, "uploads/tmp_images");

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{
                    text: `Restituisci esclusivamente HTML puro.
                            Non formattare l'output come blocco di codice.
                            Inizia con <html> e termina con </html>.
                            Non aggiungere testo o spiegazioni.`
                }]
            },
            {
                role: "user",
                parts: [
                    { text: "Metadata immagini estratte:\n" + JSON.stringify(images) },
                    { inlineData: { data: base64File, mimeType: "application/pdf" }},
                    { text: prompt }
                ]
            }
        ]
    };

    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const data = await res.json();
    const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const final = replacePlaceholders(htmlContent, images);
    const outputFile = path.join(outputDir, path.basename(pdfPath, ".pdf") + "_inline.html");
    fs.writeFileSync(outputFile, final);

    console.log(`Output con modalità inline salvato in ${outputFile}`);
}

async function processPdfJson(pdfPath, prompt) {
    // Estrai struttura PDF
    const { stdout } = await execFileAsync("python", [
        PY_EXTRACT_LAYOUT,
        pdfPath,
        "uploads/tmp_json_images"
    ]);

    const layoutJson = JSON.parse(stdout);

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [{
                    text: `Restituisci esclusivamente HTML puro.
                            Non formattare l'output come blocco di codice.
                            Inizia con <html> e termina con </html>.
                            Non aggiungere testo o spiegazioni.`
                }]
            },
            {
                role: "user",
                parts: [
                    { text: "Struttura estratta del PDF:\n" + JSON.stringify(layoutJson) },
                    { text: prompt }
                ]
            }
        ]
    };

    const res = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    const data = await res.json();
    const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const images = layoutJson.pages.flatMap(p => p.images);
    const final = replacePlaceholders(htmlContent, images);

    const outputFile = path.join(outputDir, path.basename(pdfPath, ".pdf") + "_json.html");
    fs.writeFileSync(outputFile, final);

    console.log(`✔ JSON salvato in ${outputFile}`);
}



let outputDir = ".";
let mode = "inline";

const args = process.argv.slice(2);

const pdfFiles = [];

for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--out") {
        outputDir = args[i + 1];
        i++;
    } else if (arg === "--mode") {
        mode = args[i + 1];
        i++;
    } else if (!arg.startsWith("--")) {
        pdfFiles.push(arg);
    }
}


if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`--> Modalità selezionata: ${mode}`);
console.log(`--> Cartella output selezionata: ${outputDir}`);

const prompt = HTML_PROMPT;
const MAX_CONCURRENT = 3;

async function processInBatches(files, batchSize) {
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        await Promise.all(batch.map(async (pdfPath) => {
            try {
                if (mode === "inline") {
                    await processPdfInline(pdfPath, prompt);
                } else {
                    await processPdfJson(pdfPath, prompt);
                }
            } catch (err) {
                console.error(`Errore su ${pdfPath}:`, err.message);
            }
        }));
    }
}


(async () => {
    await processInBatches(pdfFiles, MAX_CONCURRENT);
    console.log("\nTutti i PDF elaborati con successo.");
})();
