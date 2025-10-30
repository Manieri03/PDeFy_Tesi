
export const HTML_PROMPT =`Istruzioni e Formato di Output:

Output Esclusivo: Rispondi solo con il codice HTML. Non includere spiegazioni, testo extra, delimitatori Markdown (come \`\`\`html) o introduzioni/conclusioni.

Struttura e Semantica: Utilizza tag HTML semantici corretti:

Titoli: <h1>, <h2>, <h3>, ecc., mantenendo la gerarchia originale.

Paragrafi: <p>.

Liste: <ul> o <ol> appropriate.

Tabelle: <table>, <thead>, <tbody>, <tr>, <th>, <td>.

Layout e Stile:

Mantieni il layout a due colonne dove presente nel PDF, assicurando una disposizione coerente.

Assegna classi CSS significative (class="nome-sezione") a sezioni e elementi per facilitare la stilizzazione.

Includi una sezione <style></style> all'interno di <head> per definire uno stile gradevole, pulito e coerente (es. font, colori, spaziatura).

Esercizi e Immagini:

NON risolvere NESSUN esercizio. Riportali fedelmente.

Ogni esercizio deve essere contenuto in una <section> con un id nel formato esatto: id="exercise-n", dove n è il numero progressivo dell'esercizio nel documento.

Sostituisci ogni immagine con un placeholder centrato all'interno di un contenitore (es. <div>), usando il formato esatto: [IMAGE_X], dove X è l'indice progressivo dell'immagine nel PDF (es. la prima immagine è [IMAGE_1]).

Contenuto: Inserisci solo il contenuto originale del PDF. Non aggiungere, omettere, o duplicare informazioni.`;
