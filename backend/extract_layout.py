import sys
import os
import json
import pdfplumber
import fitz  # PyMuPDF

# === Config ===
pdf_path = sys.argv[1]
output_dir = sys.argv[2]

os.makedirs(output_dir, exist_ok=True)
images_dir = os.path.join(output_dir, "images")
os.makedirs(images_dir, exist_ok=True)

layout = {"pages": []}
img_counter = 1
pdf_text = pdfplumber.open(pdf_path)
pdf_img = fitz.open(pdf_path)

for page_idx in range(len(pdf_text.pages)):
    blocks = []
    page_plumber = pdf_text.pages[page_idx]
    page_fitz = pdf_img[page_idx]

    page_text = page_plumber.extract_text()
    if page_text:
        for line in page_text.split("\n"):
            line = line.strip()
            if line:
                block_type = "paragraph"
                if len(line) <= 100 and line.isupper():
                    block_type = "title"
                blocks.append({
                    "type": "text",
                    "text": line,
                    "order": len(blocks)+1
                })

    image_list = page_fitz.get_images(full=True)
    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = pdf_img.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        img_filename = f"page{page_idx+1}_img{img_counter}.{ext}"
        img_path = os.path.join(images_dir, img_filename)

        with open(img_path, "wb") as f:
            f.write(image_bytes)

        rects = []
        for inst in page_fitz.get_image_info(xrefs=True):
            if inst["xref"] == xref:
                rects.append(inst["bbox"])

        for rect in rects:
            x0, y0, x1, y1 = rect
            blocks.append({
                "type": "image",
                "placeholder": f"[IMAGE_{img_counter}]",
                "path": img_path,
                "page": page_idx+1,
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0,
                "order": len(blocks)+1
            })
            img_counter += 1

    layout["pages"].append({
        "page_number": page_idx+1,
        "blocks": blocks
    })

pdf_text.close()
pdf_img.close()

output_json = os.path.join(output_dir, "layout.json")
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(layout, f, ensure_ascii=False, indent=2)

print(json.dumps(layout, ensure_ascii=False, indent=2))
