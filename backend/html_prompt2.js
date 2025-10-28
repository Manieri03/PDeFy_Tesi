
export const HTML_PROMPT2 =`
Converti il contenuto del PDF in HTML **rispettando scrupolosamente i blocchi** in METADATA_LAYOUT_JSON.
Regole:
- Genera un <div class="block" data-page="N" data-block-index="M" style="position:absolute; left:Xpx; top:Ypx; width:WIDTHpx; height:HEIGHTpx;"> ... </div> per ogni blocco.
- Blocchi testo → <p> o <hN> se appare come titolo (stringa breve e isolata).
- Blocchi immagine → inserisci placeholder [IMAGE_IMAGEINDEX], **non inserire tag <img> direttamente**.
- Rispetta l'ordine e le coordinate X,Y, width e height.
- Se la pagina è multicolonna, mantieni i blocchi nell'ordine fornito ma inserisci <div class="columns"> come wrapper.
- Non inventare contenuti o modificare le dimensioni delle immagini.
- Rispondi solo con codice HTML completo (header, main, style opzionale), senza testo esplicativo.
- Inserisci una sezione <style></style> con stili coerenti e gradevoli.
`;
