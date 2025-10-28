#!/usr/bin/env node
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";
import { HTML_PROMPT } from "../html_prompt.js"

dotenv.config();
const execFileAsync = promisify(execFile);

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY non trovata nel file .env");

async function extractImages(pdfPath, outputDir) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const { stdout } = await execFileAsync("python", ["extract_images.py", pdfPath, outputDir]);
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

async function processPdf(pdfPath, prompt) {
    const fileBuffer = fs.readFileSync(pdfPath);
    const base64File = fileBuffer.toString("base64");

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: prompt },
                    { inlineData: { data: base64File, mimeType: "application/pdf" } }
                ]
            }
        ]
    };

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        }
    );

    if (!res.ok) throw new Error(`Errore API Gemini: ${res.status} - ${await res.text()}`);
    const data = await res.json();
    const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const images = await extractImages(pdfPath, "uploads/tmp_images");
    const htmlWithImages = replacePlaceholders(htmlContent, images);

    const outputFile = path.basename(pdfPath, ".pdf") + "_output.html";
    fs.writeFileSync(outputFile, htmlWithImages);
    console.log(`Output salvato in ${outputFile}`);
}

const pdfFiles = process.argv.slice(2);
if (pdfFiles.length === 0) {
    console.error("Uso: node cli.js file1.pdf [file2.pdf ...]");
    process.exit(1);
}

const prompt = HTML_PROMPT;
const MAX_CONCURRENT = 3;

async function processInBatches(files, batchSize) {
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        console.log(`\nBatch ${i / batchSize + 1}:`, batch);

        await Promise.all(
            batch.map(async (pdfPath) => {
                console.log(`Elaborazione: ${pdfPath}`);
                try {
                    await processPdf(pdfPath, prompt);
                } catch (err) {
                    console.error(`Errore su ${pdfPath}:`, err.message);
                }
            })
        );
    }
}

(async () => {
    await processInBatches(pdfFiles, MAX_CONCURRENT);
    console.log("\nTutti i PDF elaborati con successo.");
})();

/*
* (async () => {
    for (const pdfPath of pdfFiles) {
        console.log(`Elaborazione: ${pdfPath}`);
        try {
            await processPdf(pdfPath, prompt);
        } catch (err) {
            console.error("Errore:", err.message);
        }
*/
