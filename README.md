# PDeFy - Sistema di estrazione semantica e conversione di PDF basato su LLM
## Applicazione web e CLI per convertire PDF nativi contenenti esercizi scolastici in HTML strutturato tramite Google Gemini.

🚀 Overview

PDeFy è un prototipo sperimentale progettato per estrarre, ricostruire e convertire automaticamente materiali scolastici in formato PDF in HTML semantico, utilizzando un approccio ibrido che combina:
estrazione tradizionale (PyMuPDF, PDFPlumber), generazione strutturata tramite Large Language Models (Google Gemini 2.5 / 3 Pro), post-processing e correzione tramite editor WYSIWYG (TinyMCE).
L’obiettivo è ottenere output modificabili, accessibili e facilmente adattabili al contesto didattico.

📌 Caratteristiche principali
Due pipeline di conversione

INLINE: invio del PDF in forma visiva al modello (migliore fedeltà).

JSON: invio del layout strutturato tramite estrazione completa (testo, parole, bounding box).

Estrazione immagini accurata: bounding box, dimensioni, coordinate
sostituzione automatica dei placeholder con immagini Base64

Classificazione automatica degli esercizi
L’LLM riconosce tipologie come:
completamento, scelta-multipla, collegamento, vero-falso, calcolo, ecc.

Supporto CLI per conversioni batch automatizzate

cd backend/cli_app
pdefy --mode inline --out ./output esercizio.pdf
