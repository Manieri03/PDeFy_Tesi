import {useState, useRef,useEffect} from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { File, Send, FileText,Download  } from "lucide-react";
import logo from "./assets/PDefyIcon.png";

function App() {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const responseRef = useRef(null);

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

            setResponse(text);


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
        const element = document.createElement("a");
        const file = new Blob([response], { type: "text/html" });
        element.href = URL.createObjectURL(file);
        element.download = "output.html";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="container_div">
            <div className="header_div">
            <img className="logo" src={logo}/>
            <h1>Estrazione PDF</h1>
            </div>
            <form className="form_input" onSubmit={handleSubmit}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Inserisci qui il tuo prompt..."
                    rows={5}
                />

                <label className="lbl_pdf">
                    <File size={18}></File>
                    {file ? file.name : "Seleziona PDF"}
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                </label>
                <button className="btn_submit" type="submit" disabled={loading}>
                    <Send size={28}></Send>{loading ? "Caricamento..." : "Invia"}
                </button>
            </form>

            {error && (
                <div className="error_div">
                    <h3>Errore:</h3>
                    <p>{error}</p>
                </div>
            )}
            <p></p>

            {response && (
                <div ref={responseRef} className="response_div">
                    <h2><FileText size={20} className="icon_response"/>Output:</h2>
                    <textarea
                        className="response_textarea"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={30}
                    />
                    <button className="btn_submit" id="btn_download" onClick={downloadHTML}>
                        <Download size={30} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;