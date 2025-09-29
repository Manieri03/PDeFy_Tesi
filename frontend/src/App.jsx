import {useState} from "react";
import "./App.css";

function App() {
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/generate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({prompt}),
        });
        const data = await res.json();
        setResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "Nessuna risposta");
    };
    return (<div><h1>Demo API Gemini</h1>
        <form className="form_input" onSubmit={handleSubmit}><input type="text" value={prompt}
                                                                    onChange={(e) => setPrompt(e.target.value)}/>
            <button type="submit">Invia</button>
        </form>
        <h2>Risposta:</h2> <p>{response}</p></div>);
}

export default App;