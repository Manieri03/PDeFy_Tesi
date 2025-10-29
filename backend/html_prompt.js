
export const HTML_PROMPT =`Converti il contenuto del PDF fornito in un HTML completo e fedele alla struttura dell'input.
        - Usa tag corretti per titoli (<h1>-<h6>), paragrafi (<p>), liste (<ul>/<ol>), tabelle (<table>).
        - Mantieni la gerarchia dei titoli e dei paragrafi come nel PDF.
        - Inserisci classi CSS significative per ogni sezione o elemento
        - Non includere contenuti inutili, che non appartengono al pdf o duplicati.
        - Rispondi solo con il codice HTML, senza spiegazioni o testo extra.
        - inserisci anche una sezione <style></style> per la definizione dello stile, gradevole e coerente.
        - non risolvere NESSUN esercizio.
        - non inserire delimitatori markdown (\`\`\`html) e (\`\`\`) all'inizio e alla fine
        - numera chiaramente gli esercizi in una section nel formato avente un id nel formato: "exercise-n", dove n è il numero dell'esercizio in questione
        - dove trovi un'immagine, inserisci un tag placeholder nel formato [IMAGE_X], ben centrato in un contenitore dove andra poi l'immagine, dove X è l'indice progressivo dell'immagine nel PDF.
        - Dove vedi due colonne, lasciale e mantieni il layout coerente, presta particolare attenzione alla disposizione del pdf.
        - Racchiudi in <span class="blank"></span> ogni spazio o linea (____, —, ___) destinato a essere completato negli esercizi.
        - Se lo spazio è composto da più trattini, conserva la lunghezza approssimativa nel numero di span o tramite CSS (es. width proporzionato).
`;
