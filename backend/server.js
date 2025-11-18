import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { performance } from "perf_hooks";
import { execFile } from "child_process";
import path from "path";

const LLM_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const LLM_MODEL_PRO = "gemini-2.5-pro:generateContent";
const LLM_MODEL_FLASH = "gemini-2.5-flash:generateContent";

const LLM_SELECTED_MODEL = LLM_MODEL_FLASH;
const LLM_MODEL_URL = `${LLM_API_BASE}/${LLM_SELECTED_MODEL}`;

function clearDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
            const filePath = `${dirPath}/${file}`;
            if (fs.lstatSync(filePath).isDirectory()) {
                clearDirectory(filePath);
                fs.rmdirSync(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        });
    }
}

function extractImages(pdfPath, outputDir) {
    return new Promise((resolve, reject) => {
        execFile("python", ["extract_images.py", pdfPath, outputDir], (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(JSON.parse(stdout));
        });
    });
}

function replacePlaceholders(html, extractedImages) {

    // sostituisci i placeholder nell'ordine
    extractedImages.forEach((img, index) => {
        const placeholder = `[IMAGE_${index + 1}]`;
        const base64 = fs.readFileSync(img.path).toString("base64");
        const imgTag = `<img src="data:image/${img.ext};base64,${base64}" style="width:${img.width}px;height:${img.height}px;" />`;
        html = html.replaceAll(placeholder, imgTag);
    });

    return html;
}

function generateMappingFromImages(extractedImages) {
    return extractedImages.map((img, index) => {
        return {
            placeholder: `[IMAGE_${index + 1}]`,
            page: img.page,
            x: img.x,
            y: img.y
        };
    });
}

dotenv.config();
const app = express();

//parser di multipart/form-data
const uploadInline = multer({ dest: "uploads/tmp_layout_inline/pdf/" });
const uploadJson = multer({ dest: "uploads/tmp_layout_JSON/pdf/" });

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
app.post("/api/generate", uploadInline.single("file"), async (req, res) => {
    const log = makeTimer("Gemini PDF");
    let filePath = null;

    try {
        log("Inizio richiesta");
        const { prompt } = req.body;

        if (!prompt) return res.status(400).json({ error: "Prompt mancante" });
        if (!req.file) return res.status(400).json({ error: "Nessun file PDF caricato" });

        const baseDir = "uploads/tmp_layout_inline";
        const pdfDir = path.join(baseDir, "pdf");
        const imagesDir = path.join(baseDir, "images");

        [baseDir, pdfDir, imagesDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        filePath = req.file.path;

        const fileBuffer = fs.readFileSync(filePath);
        const base64File = fileBuffer.toString("base64");
        let images = await extractImages(filePath, imagesDir);

        // Costruzione richiesta per Gemini
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Metadata immagini estratte:\n" + JSON.stringify(images) },
                        { inlineData: { data: base64File, mimeType: "application/pdf" } },
                        { text: prompt }
                    ],
                },
            ],
        };

        log("Body costruito, invio a Gemini...");

        const response = await fetch(`${LLM_MODEL_URL}?key=${API_KEY}`,
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

        const data = await response.json();
        log("Risposta ricevuta");
        const htmlContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const mapping = generateMappingFromImages(images);
        const finalHtml = replacePlaceholders(htmlContent, images);

        res.json({
            html: finalHtml,
            mapping,
            images,
            pdf_saved: filePath,
            images_dir: imagesDir
        });

    } catch (err) {
        console.error("Errore backend:", err);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: err.message });
    } finally {
        /*
        // Pulizia PDF temporanei dopo un po' di tempo
        setTimeout(() => {
            try {
                clearDirectory("uploads/tmp_layout_inline");
            } catch (cleanupErr) {
                console.error("Errore nella pulizia:", cleanupErr);
            }
        }, 2000);
        */
    }
});

function extractStructured(pdfPath, imagesDir, layoutsDir) {
    return new Promise((resolve, reject) => {
        execFile(
            "python",
            ["extract_layout_JSON.py", pdfPath, imagesDir],
            (err, stdout, stderr) => {
                if (err) return reject(err);

                try {
                    const json = JSON.parse(stdout);

                    const timestamp = new Date()
                        .toISOString()
                        .replace(/[:.]/g, "-");

                    const jsonPath = path.join(
                        layoutsDir,
                        `page_layout_${timestamp}.json`
                    );

                    fs.writeFileSync(
                        jsonPath,
                        JSON.stringify(json, null, 2),
                        "utf-8"
                    );

                    resolve({
                        json,
                        jsonPath,
                        imagesDir
                    });

                } catch (e) {
                    reject(
                        new Error("Errore nel parsing o salvataggio JSON: " + e.message)
                    );
                }
            }
        );
    });
}


function replaceStructuredImages(html, structuredJson) {
    let imageIndex = 1;

    // Estrae tutte le immagini da tutte le pagine in ordine
    const allImages = structuredJson.pages.flatMap(page =>
        page.images?.map(img => ({
            index: imageIndex++,
            path: img.path,
            width: img.width,
            height: img.height
        })) || []
    );

    // Sostituzione identica al primo endpoint
    allImages.forEach(img => {
        const placeholder = `[IMAGE_${img.index}]`;

        // Converte immagine in base64
        const base64 = fs.readFileSync(img.path).toString("base64");

        const tag = `<img src="data:image/png;base64,${base64}" style="width:${img.width}px;height:${img.height}px;">`;

        html = html.replaceAll(placeholder, tag);
    });

    return html;
}


app.post("/api/generate_JSON", uploadJson.single("file"), async (req, res) => {
    let filePath = null;

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt mancante" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Nessun file PDF caricato" });
        }

        filePath = req.file.path;
        const outputDir = "uploads/tmp_layout_JSON";

        const imagesDir = path.join(outputDir, "images");
        const layoutsDir = path.join(outputDir, "layouts");

        [outputDir, imagesDir, layoutsDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const { json: structuredJson, jsonPath } =
            await extractStructured(filePath, imagesDir, layoutsDir);

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text:
                                "Struttura estratta del PDF:\n" +
                                JSON.stringify(structuredJson)
                        },
                        {
                            text:
                                "\n\nIstruzioni:\n" +
                                prompt
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${LLM_MODEL_URL}?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errTxt = await response.text();
            throw new Error(`Errore API Gemini: ${response.status} - ${errTxt}`);
        }

        const data = await response.json();
        const html = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        const finalHtml = replaceStructuredImages(html, structuredJson);

        res.json({
            html: finalHtml,
            structured: structuredJson,
            saved_json: jsonPath,
            images_dir: imagesDir
        });

    } catch (err) {
        console.error("Errore /api/generate_JSON:", err);
        res.status(500).json({ error: err.message });

    } finally {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        /*
        setTimeout(() => {
            try {
                clearDirectory("uploads/pdf");
            } catch (_) {}
        }, 2000);
         */
    }
});




const PORT = 5000;
app.listen(PORT, () => console.log(`Backend avviato su http://localhost:${PORT}`));
