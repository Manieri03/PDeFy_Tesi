
export const HTML_PROMPT =`Converti il contenuto del PDF fornito in un HTML completo e fedele alla struttura dell'input.
        - Usa tag corretti per titoli (<h1>-<h6>), paragrafi (<p>), liste (<ul>/<ol>), tabelle (<table>), immagini (<img>).
        - Mantieni la gerarchia dei titoli e dei paragrafi come nel PDF.
        - Inserisci classi CSS significative per ogni sezione o elemento
        - Includi un <header>, <main> e <footer> se appropriato.
        - Produci HTML leggibile, indentato e pronto per essere scalato e stilizzato.
        - Non includere contenuti inutili o duplicati.
        - Rispondi solo con il codice HTML, senza spiegazioni o testo extra.
        - Se sono presenti esercizi numerali nell'ordine corretto.
        - inserisci anche una sezione <style></style> per la definizione dello stile, gradevole e coerente.
        - non risolvere NESSUN esercizio.
        - non inserire (\`\`\`html) e (\`\`\`) all'inizio e alla fine
        - quando c'è un esercizio con degli spazi per inserire lettere tra parole, racchiudi le parole in uno span
        - quando c'è un esercizio con degli spazi per inserire parole, racchiudi le frasi in uno span
        - numera chiaramente gli esercizi in una section nel formato avente un id nel formato: "exercise-n", dove n è il numero dell'esercizio in questione
        - dove trovi un'immagine, inserisci un tag placeholder nel formato [IMAGE_X], ben centrato in un contenitore dove andra poi l'immagine, dove X è l'indice progressivo dell'immagine nel PDF.
        - Non aggiungere altri tag <img>, <image>, <figure> o immagini di esempio.
        - Non generare descrizioni, alt testuali inventati o immagini illustrative: il backend sostituirà i placeholder con le vere immagini estratte.
        - Quando individui un esercizio dove ci si aspetta che si riempia con parole o lettere, in quei punti metti visivamente dei trattini per capire che bisogna scriverci e marca le sezioni con uno span specifico.
`;
