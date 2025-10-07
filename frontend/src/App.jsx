import {useState, useRef,useEffect} from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { File, Send, FileText,Download,FileCode, Loader } from "lucide-react";
import logo from "./assets/PDefyIcon.png";
import WysiwygEditor from "./WysiwygEditor";

function App() {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const responseRef = useRef(null);
    const [editedHtml, setEditedHtml] = useState("");
    const [extractedStyle, setExtractedStyle] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResponse("");
        
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
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("file", file);

            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Errore HTTP: ${res.status}`);
            }

            const data = await res.json();
            console.log("Risposta completa:", data); // Debug

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("Nessuna risposta dal modello");
            }

            //estrazione dello stile
            const styleMatch = text.match(/<style[\s\S]*?<\/style>/);
            const styleContent = styleMatch ? styleMatch[0] : "";
            const htmlContent = text.replace(/<style[\s\S]*?<\/style>/, "");


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
        const content = `${extractedStyle}\n${editedHtml || response}`;
        const element = document.createElement("a");
        const file = new Blob([content], { type: "text/html" });
        element.href = URL.createObjectURL(file);
        element.download = "output.html";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleHtmlPreset = () => {
        setPrompt(`Converti il contenuto del PDF fornito in un HTML completo, ben strutturato e semantico. 
        - Usa tag corretti per titoli (<h1>-<h6>), paragrafi (<p>), liste (<ul>/<ol>), tabelle (<table>), immagini (<img>).
        - Mantieni la gerarchia dei titoli e dei paragrafi come nel PDF.
        - Inserisci classi CSS significative per ogni sezione o elemento
        - Includi un <header>, <main> e <footer> se appropriato.
        - Produci HTML leggibile, indentato e pronto per essere scalato e stilizzato.
        - Non includere contenuti inutili o duplicati.
        - Rispondi solo con il codice HTML, senza spiegazioni o testo extra.
        - Se sono presenti esercizi numerali nell'ordine corretto.
        - inserisci anche una sezione <style></style> per la definizione dello stile, gradevole e coerente.
        - non risolvere alcun esercizio, limitati a riportarli nel modo migliore
        - non inserire (\`\`\`html) e (\`\`\`) all'inizio e alla fine
        - quando trovi delle immagini o illustrazioni, scrivi solo il cosa sono e non parole come immagine o illustrazione`);
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
            <form className="form_input" onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Inserisci qui il tuo prompt..."
                    rows={5}
                />

                <label className="lbl_pdf">
                    <File size={20}></File>
                    {file ? file.name : "Seleziona PDF"}
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                </label>
                <button className="btn_submit" type="submit" disabled={loading}>
                    {loading ? <Loader className="spin" size={28}></Loader> : <Send size={28}></Send>}
                </button>
            </form>

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

                    <WysiwygEditor classname="editor_tiny" initialHtml={response} onChange={setEditedHtml} editedHtml={editedHtml} />

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