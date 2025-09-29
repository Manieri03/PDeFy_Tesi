import {useState, useRef,useEffect} from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import { File, Send } from "lucide-react";
import logo from "./assets/PDefy.png";

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
        if (responseRef.current) {
            const element = responseRef.current;
            const elementTop = element.getBoundingClientRect().top + window.scrollY;
            const scrollTo = elementTop - window.innerHeight / 2 + element.offsetHeight / 2;

            window.scrollTo({
                top: scrollTo,
                behavior: "smooth",
            });
        }
    }, [response]);



    return (
        <div className="container_div">
            <div className="header_div">
            <img className="logo" src={logo}/>
            <h1>PDefy - Estrazione PDF</h1>
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
                    <Send size={18}></Send>{loading ? "Caricamento..." : "Invia"}
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
                    <h2>Risposta:</h2>
                    <ReactMarkdown>{response}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

export default App;