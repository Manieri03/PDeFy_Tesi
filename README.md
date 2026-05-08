# PDeFy

PDeFy è un'applicazione web e CLI per la conversione di PDF scolastici in HTML semantico.  
Il sistema combina tecniche di parsing tradizionale con modelli LLM, in particolare Google Gemini, per riconoscere la struttura dei documenti, classificare automaticamente gli esercizi e produrre output HTML modificabili e pronti per il web.

Il progetto è pensato come prototipo sperimentale per trasformare materiali didattici in formato PDF in contenuti digitali più accessibili, strutturati e riutilizzabili.

## Funzionalità principali

- Conversione di PDF scolastici in HTML semantico
- Riconoscimento automatico della struttura del documento
- Classificazione delle tipologie di esercizio
- Supporto a esercizi di completamento, scelta multipla, vero/falso, collegamento e calcolo
- Estrazione di testo, immagini e layout dal PDF
- Integrazione con Google Gemini per la ricostruzione semantica del contenuto
- Editor WYSIWYG per modificare l'HTML generato
- Supporto CLI per conversioni batch
- Applicazione frontend per l'utilizzo tramite interfaccia web

## Architettura del progetto

Il progetto è organizzato in due componenti principali:

```text
PDeFy/
│
├── backend/
│   ├── cli_app/          # Applicazione CLI
│   ├── server.js         # Avvio del server backend
│   ├── package.json      # Dipendenze backend
│   └── ...
│
├── frontend/
│   ├── src/              # Codice sorgente React
│   ├── package.json      # Dipendenze frontend
│   └── ...
│
├── package.json
└── README.md
