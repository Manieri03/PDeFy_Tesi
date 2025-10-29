import {useState, useRef,useEffect} from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { File, Send, FileText,Download,FileCode, Loader } from "lucide-react";
import logo from "./assets/PDefyIcon.png";
import WysiwygEditor from "./WysiwygEditor";
import { HTML_PROMPT } from "../../backend/html_prompt.js";


function App() {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");

    //states di file singolo e multipli
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);

    const [currentFile, setCurrentFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const responseRef = useRef(null);
    const [editedHtml, setEditedHtml] = useState("");
    const [extractedStyle, setExtractedStyle] = useState("");



    const processQueue = async (e) => {
        e.preventDefault();
        if (!prompt) {
            alert("Inserisci un prompt");
            return;
        }
        if (!files || files.length === 0) {
            alert("Seleziona almeno un file PDF!");
            return;
        }

        // Imposta il loading all'inizio del batch
        setLoading(true);
        setCurrentFile(null); // Resetta il file corrente all'inizio

        try {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                setCurrentFile(f.name); // Aggiorna il file corrente

                const formData = new FormData();
                formData.append("prompt", prompt);
                formData.append("file", f);

                const res = await fetch("/api/generate", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.text();
                    // Lancia un errore per fermare il ciclo se un file fallisce
                    throw new Error(`Errore con ${f.name} - ${res.status}: ${err}`);
                }

                const data = await res.json();
                const text = data.html || "";
                if (!text) throw new Error(`Nessuna risposta dal modello per ${f.name}`);

                const styleMatch = text.match(/<style[\s\S]*?<\/style>/);
                const styleContent = styleMatch ? styleMatch[0] : "";
                const htmlContent = text.replace(/<style[\s\S]*?<\/style>/, "");

                setExtractedStyle(styleContent);
                setEditedHtml(htmlContent);
                setResponse(htmlContent);

                downloadHTML();

                console.log(`${f.name} completato`);
            }

            // Una volta che tutti i file sono completati
            alert("Tutti i PDF sono stati elaborati!");

        } catch (err) {
            console.error("Errore nel batch:", err);
            setError(err.message);
        } finally {
            setLoading(false);
            setCurrentFile(null);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResponse("");

        //validazione input
        if (!prompt) {
            alert("Inserisci un prompt");
            return;
        }
        if (!file) {
            alert("Seleziona un file PDF!");
            return;
        }

        setLoading(true);

        try {
            //costruzione formdata
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("file", file);

            //invio al backend
            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            });

            //controllo di errori di rete
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Errore HTTP: ${res.status}`);
            }

            //parsing della risposta del modello
            const data = await res.json();
            //console.log("Risposta completa:", data); Debug

            const text = data.html;
            if (!text) {
                throw new Error("Nessuna risposta dal modello");
            }

            //estrazione dello stile dall'intero testo
            const styleMatch = text.match(/<style[\s\S]*?<\/style>/);
            const styleContent = styleMatch ? styleMatch[0] : "";
            //estrazione del solo html
            const htmlContent = text.replace(/<style[\s\S]*?<\/style>/, "");

            //salvataggio degli stati di React
            setExtractedStyle(styleContent);
            setResponse(htmlContent);
            setEditedHtml(htmlContent);

        } catch (err) {
            console.error("Errore:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (response && responseRef.current) {
            // Scroll verso la risposta
            responseRef.current.scrollIntoView({
                behavior: "smooth",
            });
        }
    }, [response]);

    const downloadHTML = () => {
        let content = `${extractedStyle}\n${editedHtml || response}`;
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const deleteButtons = doc.querySelectorAll(".delete-btn");
        deleteButtons.forEach(btn => btn.remove());
        const cleanedContent = doc.documentElement.outerHTML;

        const element = document.createElement("a");
        const fileBlob = new Blob([cleanedContent], { type: "text/html" });
        element.href = URL.createObjectURL(fileBlob);
        element.download = "output.html";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    //Prompt predefinito completo per Html
    const handleHtmlPreset = () => {
        setPrompt(HTML_PROMPT);
    };

    return (
        <div className="container_div">
            <div className="header_div">
                <img className="logo" src={logo}/>
                <h1>Estrazione PDF</h1>
            </div>
            <div className="predefined_prmpt_div">
                <button className="btn_submit" onClick={handleHtmlPreset}>HTML <FileCode size={20}></FileCode></button>
            </div>
            <form className="form_input" onSubmit={(e) => processQueue(e)}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Inserisci qui il tuo prompt..."
                    rows={5}
                />

                <label className="lbl_pdf">
                    <File size={20} />
                    {files.length > 1
                        ? `${files.length} file selezionati`
                        : files.length === 1
                            ? files[0].name
                            : "Seleziona PDF"}
                    <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                    />
                </label>
                <button className="btn_submit" type="submit" disabled={loading}>
                    {loading ? <Loader className="spin" size={28}></Loader> : <Send size={28}></Send>}
                </button>
            </form>


            {loading && currentFile && (
                <div className="loading_div">
                    <p>Elaborazione di: <b>{currentFile}</b></p>
                </div>
            )}

            {error && (
                <div className="error_div">
                    <h3>Errore:</h3>
                    <p>{error}</p>
                </div>
            )}

            {response && (
                <div ref={responseRef} className="response_div">
                    <h2>
                        <FileText size={20} className="icon_response" /> Output:
                    </h2>

                    <WysiwygEditor classname="editor_tiny" initialHtml={response} onChange={setEditedHtml} editedHtml={editedHtml} style={extractedStyle} />

                    <button
                        className="btn_submit"
                        id="btn_download"
                        onClick={downloadHTML}
                    >
                        <Download size={30} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;