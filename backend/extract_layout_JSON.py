import pdfplumber
import sys, os, json
sys.stdout.reconfigure(encoding='utf-8')

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

data = {
    "pages": []
}

with pdfplumber.open(pdf_path) as pdf:
    for page_index, page in enumerate(pdf.pages, start=1):

        #Estrazioni testuale
        full_text = page.extract_text() or ""
        words = page.extract_words() or []

        #Estrazione tabelle
        tables = page.extract_tables() or []

        #Estrazione immagini
        images_info = []
        for img_index, img in enumerate(page.images, start=1):
            # Bounding box recuperata
            x0, y0, x1, y1 = img["x0"], img["top"], img["x1"], img["bottom"]

            # Ritaglio immagine
            cropped = page.within_bbox((x0, y0, x1, y1)).to_image(resolution=300)
            img_path = f"{output_dir}/page{page_index}_img{img_index}.png"
            cropped.save(img_path, format="PNG")

            images_info.append({
                "page": page_index,
                "path": img_path,
                "ext": "png",
                "bbox": [x0, y0, x1, y1],
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0
            })

        data["pages"].append({
            "page": page_index,
            "text": full_text,
            "words": words,
            "tables": tables,
            "images": images_info
        })

print(json.dumps(data, ensure_ascii=False))
