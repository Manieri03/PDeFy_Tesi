# extract_layout.py
import sys
import os
import json
import numpy as np
from pdf2image import convert_from_path
import layoutparser as lp
from PIL import Image
import pytesseract

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

os.makedirs(output_dir, exist_ok=True)
images_dir = os.path.join(output_dir, "images")
os.makedirs(images_dir, exist_ok=True)

# Converti PDF in immagini (una per pagina)
pages_images = convert_from_path(pdf_path, dpi=150)
all_pages_data = []
image_index = 1

# Carica modello LayoutParser
model = lp.PaddleDetectionLayoutModel(
    "lp://HJDataset/faster_rcnn_R_50_FPN_1x/config",  # esempio modello leggero
    threshold=0.5,
    device='cpu'
)

for page_idx, page_image in enumerate(pages_images, start=1):
    img_array = np.array(page_image)

    # Rilevamento layout
    layout = model.detect(img_array)

    page_blocks = []

    for b in layout:
        x0, y0, x1, y1 = b.coordinates
        block_type = b.type

        if block_type in ["Text", "Title", "List"]:
            # OCR solo sul blocco testuale
            cropped = page_image.crop((x0, y0, x1, y1))
            text = pytesseract.image_to_string(cropped, lang="ita").strip().replace("\n", " ")
            if text:
                page_blocks.append({
                    "type": "text",
                    "text": text,
                    "page": page_idx,
                    "bbox": [x0, y0, x1, y1],
                    "x": x0,
                    "y": y0,
                    "width": x1 - x0,
                    "height": y1 - y0,
                    "font": None,
                    "size": None,
                })
        elif block_type in ["Figure", "Table"]:
            # Salva immagine del blocco
            cropped = page_image.crop((x0, y0, x1, y1))
            img_filename = f"page{page_idx}_img{image_index}.png"
            img_path = os.path.join(images_dir, img_filename)
            cropped.save(img_path)
            page_blocks.append({
                "type": "image",
                "page": page_idx,
                "bbox": [x0, y0, x1, y1],
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0,
                "path": img_path,
                "ext": "png",
                "index": image_index
            })
            image_index += 1

    all_pages_data.append({
        "page_number": page_idx,
        "width": img_array.shape[1],
        "height": img_array.shape[0],
        "blocks": page_blocks
    })

# Salva JSON
output_json = os.path.join(output_dir, "layout.json")
with open(output_json, "w", encoding="utf-8") as f:
    json.dump({"pages": all_pages_data, "images_dir": images_dir}, f, ensure_ascii=False, indent=2)

# Output per Node.js
print(json.dumps({"pages": all_pages_data, "images_dir": images_dir}))
