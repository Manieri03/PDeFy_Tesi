import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { performance } from "perf_hooks";
import { execFile } from "child_process";
import path from "path";

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

function extractImages(pdfPath, outputDir = "uploads/tmp_images") {
    return new Promise((resolve, reject) => {
        execFile("python", ["extract_images.py", pdfPath, outputDir], (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(JSON.parse(stdout));
        });
    });
}
function replacePlaceholders(html, extractedImages) {
    // ordina le immagini per pagina, poi per y , poi per x
    const sortedImages = [...extractedImages].sort((a, b) => {
        if (a.page !== b.page) return a.page - b.page;
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    // sostituisci i placeholder nell'ordine
    sortedImages.forEach((img, index) => {
        const placeholder = `[IMAGE_${index + 1}]`;
        const base64 = fs.readFileSync(img.path).toString("base64");
        const imgTag = `<img src="data:image/${img.ext};base64,${base64}" style="width:${img.width}px;height:${img.height}px;" />`;
        html = html.replaceAll(placeholder, imgTag);
    });

    return html;
}

function replacePlaceholders2(html, layout) {
    if (!layout || !Array.isArray(layout.pages)) return html;

    let out = "";

    layout.pages.forEach((page) => {
        if (!page.blocks || !Array.isArray(page.blocks)) return;

        const wrapperWidth = Math.round(page.width);
        const wrapperHeight = Math.round(page.height);

        let pageContent = "";

        page.blocks.forEach(block => {
            const leftPx = Math.round(block.x * page.width);
            const topPx = Math.round(block.y * page.height);
            const widthPx = Math.round(block.width * page.width);
            const heightPx = Math.round(block.height * page.height);

            if(block.type === "text") {
                let tag = "p";
                if(block.role === "title") tag = "h1";
                pageContent += `<${tag} class="text-block" style="
            position:absolute;
            left:${leftPx}px;
            top:${topPx}px;
            width:${widthPx}px;
            font-size:${block.font_size}px;
        ">${block.text}</${tag}>`;
            }

            if(block.type === "image") {
                const absPath = path.join(layout.images_dir, path.basename(block.path));
                if(!fs.existsSync(absPath)) return;
                const base64 = fs.readFileSync(absPath).toString("base64");
                pageContent += `<div class="image-wrapper" style="
            position:absolute;
            left:${leftPx}px;
            top:${topPx}px;
            width:${widthPx}px;
            height:${heightPx}px;
        "><img src="data:image/${block.ext};base64,${base64}" style="width:100%;height:100%;object-fit:contain;"></div>`;
            }
        });

        out += `<div class="page-wrapper" style="position:relative; width:${wrapperWidth}px; height:${wrapperHeight}px;">${pageContent}</div>`;
    });

    return out;
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

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir("uploads/pdf");
ensureDir("uploads/tmp_images");

//parser di multipart/form-data
const upload = multer({ dest: "uploads/pdf/" });

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
        let images = await extractImages(filePath);

// ordina e normalizza immagini e blocchi testo
        images = images
            .map(img => ({ ...img, text: img.text?.replace(/\s+/g, " ").trim() || "" }))
            .sort((a, b) => {
                if (a.page !== b.page) return a.page - b.page;
                if (a.y !== b.y) return a.y - b.y;
                return a.x - b.x;
            });

        images.forEach((img, index) => {
            img.placeholder = `[IMAGE_${index + 1}]`;
        });

        const allBlocks = [
            ...images.map(img => ({ type: "image", ...img })),
        ];

        allBlocks.forEach(block => {
            if(block.type === "text" && block.text) {
                block.text = block.text.replace(/\s+/g, " ").trim();
            }
        });

        allBlocks.sort((a, b) => {
            if (a.page !== b.page) return a.page - b.page;
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        //costruzione del corpo della richiesta: prompt + pdf inline
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        //parti della richiesta, prompt + pdf inline
                        {
                            text: "Metadata immagini estratte:\n" + JSON.stringify(images)
                        },
                        {
                            inlineData: {
                                data: base64File,
                                mimeType: "application/pdf",
                            },
                        },
                        { text: prompt }
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

        const mappingPart = data?.candidates?.[0]?.content?.parts?.[1]?.text;
        let mapping = [];
        mapping = generateMappingFromImages(images);

        const finalHtml = replacePlaceholders(htmlContent, images);

        res.json({ html: finalHtml, mapping, images });


    } catch (err) {
        console.error("Errore backend:", err);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: err.message });
    }finally{
        setTimeout(() => {
            try {
                clearDirectory("uploads/pdf");
                clearDirectory("uploads/tmp_images");
                console.log("Cartelle temporanee pulite");
            } catch (cleanupErr) {
                console.error("Errore nella pulizia:", cleanupErr);
            }
        }, 2000);
    }
});




const PORT = 5000;
app.listen(PORT, () => console.log(`Backend avviato su http://localhost:${PORT}`));
