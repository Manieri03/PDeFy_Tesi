#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";
import { HTML_PROMPT } from "../html_prompt.js"
import {HTML_PROMPT2} from "../html_prompt_2.js";
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


const UPLOADS_DIR = path.resolve(__dirname, "../uploads");

// INLINE
const INLINE_DIR = path.join(UPLOADS_DIR, "tmp_layout_inline");
const INLINE_PDF_DIR = path.join(INLINE_DIR, "pdf");
const INLINE_IMG_DIR = path.join(INLINE_DIR, "images");

// JSON
const JSON_DIR = path.join(UPLOADS_DIR, "tmp_layout_JSON");
const JSON_PDF_DIR = path.join(JSON_DIR, "pdf");
const JSON_IMG_DIR = path.join(JSON_DIR, "images");
const JSON_LAYOUT_DIR = path.join(JSON_DIR, "layouts");


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
    images.forEach((img, i) => {
        const placeholder = `[IMAGE_${i + 1}]`;
        const base64 = fs.readFileSync(img.path).toString("base64");
        const imgTag =
            `<img src="data:image/${img.ext};base64,${base64}" style="width:${img.width}px;height:${img.height}px;" />`;
        html = html.replaceAll(placeholder, imgTag);
    });
    return html;
}

function clearDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    for (const file of fs.readdirSync(dirPath)) {
        const fullPath = path.join(dirPath, file);

        try {
            const stat = fs.lstatSync(fullPath);

            if (stat.isDirectory()) {
                for (const inner of fs.readdirSync(fullPath)) {
                    const innerPath = path.join(fullPath, inner);
                    fs.unlinkSync(innerPath);
                }
            } else {
                fs.unlinkSync(fullPath);
            }

        } catch (err) {
            console.warn("⚠️ Impossibile eliminare:", fullPath, err.message);
        }
    }
}



async function processPdfInline(pdfPath, prompt) {

    try{
        // Copia PDF in cartella ufficiale
        const pdfCopy = path.join(INLINE_PDF_DIR, path.basename(pdfPath));
        fs.copyFileSync(pdfPath, pdfCopy);

        const base64File = fs.readFileSync(pdfCopy).toString("base64");

        // Estrai immagini nella cartella ufficiale
        const images = await extractImages(pdfCopy, INLINE_IMG_DIR);

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{
                        text: `Restituisci esclusivamente HTML puro.
                            Non formattare l'output come blocco di codice.
                            Non inserire i delimitatori \`\`\`html o \`\`\`.
                            Inizia direttamente dal primo tag HTML e termina con l'ultimo.
                            Se stai per inserire un blocco \`\`\`html, rimuovilo e restituisci solo il contenuto.
                            Non includere spiegazioni, testo extra o introduzioni/conclusioni.`
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
        const outputFile = path.join(outputDir, path.basename(pdfPath) + "_inline.html");
        fs.writeFileSync(outputFile, final);

        console.log(`Output inline salvato in ${outputFile}`);
    }catch (err)
    {
        console.error(`Errore inline su ${pdfPath}:`, err.message);
    }finally {
        clearDirectory(INLINE_PDF_DIR);
        clearDirectory(INLINE_IMG_DIR);
    }

}


async function processPdfJson(pdfPath, prompt) {

    try{
        const pdfCopy = path.join(JSON_PDF_DIR, path.basename(pdfPath));
        fs.copyFileSync(pdfPath, pdfCopy);

        // Estraggo struttura
        const { stdout } = await execFileAsync("python", [
            PY_EXTRACT_LAYOUT,
            pdfCopy,
            JSON_IMG_DIR
        ]);

        const layoutJson = JSON.parse(stdout);

        const layoutFile = path.join(
            JSON_LAYOUT_DIR,
            path.basename(pdfPath, ".pdf") + "_layout.json"
        );

        fs.writeFileSync(layoutFile, JSON.stringify(layoutJson, null, 2), "utf-8");

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{
                        text: `Restituisci esclusivamente HTML puro.
                            Non formattare l'output come blocco di codice.
                            Non inserire i delimitatori \`\`\`html o \`\`\`.
                            Inizia direttamente dal primo tag HTML e termina con l'ultimo.
                            Se stai per inserire un blocco \`\`\`html, rimuovilo e restituisci solo il contenuto.
                            Non includere spiegazioni, testo extra o introduzioni/conclusioni.`
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

        if (!res.ok) {
            throw new Error(`Errore HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.error) {
            throw new Error("Errore Gemini: " + data.error.message);
        }

        const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";


        const images = layoutJson.pages.flatMap(p => p.images);
        const final = replacePlaceholders(htmlContent, images);

        const outputFile = path.join(outputDir, path.basename(pdfPath) + "_json.html");
        fs.writeFileSync(outputFile, final);

        console.log(`Output JSON salvato in ${outputFile}`);
    }catch(err){
        console.error(`Errore JSON su ${pdfPath}:`, err.message);
    }finally {
        clearDirectory(JSON_PDF_DIR);
        clearDirectory(JSON_IMG_DIR);
        clearDirectory(JSON_LAYOUT_DIR);
    }
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
console.log(`--> Cartella output: ${outputDir}`);

const prompt_inline = HTML_PROMPT;
const prompt_json=HTML_PROMPT2;
const MAX_CONCURRENT = 3;


async function processInBatches(files, batchSize) {
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);

        await Promise.all(batch.map(async (pdfPath) => {
            try {
                if (mode === "inline") {
                    await processPdfInline(pdfPath, prompt_inline);
                } else {
                    await processPdfJson(pdfPath, prompt_json);
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
