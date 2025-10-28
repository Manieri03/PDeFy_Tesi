import sys
import json
import os
import fitz

def ensure_dir(p):
    os.makedirs(p, exist_ok=True)

def save_image(base_image, out_path):
    with open(out_path, "wb") as f:
        f.write(base_image["image"])

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error":"usage: extract_layout.py input.pdf output_dir"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    ensure_dir(output_dir)
    images_dir = os.path.join(output_dir, "images")
    ensure_dir(images_dir)

    doc = fitz.open(pdf_path)
    pages_out = []

    img_global_index = 1

    for page_index, page in enumerate(doc):
        page_num = page_index + 1
        page_w = float(page.rect.width)
        page_h = float(page.rect.height)

        page_dict = {
            "page": page_num,
            "width": page_w,
            "height": page_h,
            "blocks": []
        }

    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:  # solo testo
            continue
        lines = b.get("lines", [])
        text_content = " ".join([span["text"] for line in lines for span in line["spans"]]).strip()
        if not text_content:
            continue
        max_font_size = max(span.get("size", 12) for line in lines for span in line["spans"])
        role = "title" if max_font_size > 14 and len(text_content.split()) < 10 else "paragraph"
        font_name = lines[0]["spans"][0].get("font", "unknown") if lines and lines[0]["spans"] else "unknown"

        page_dict["blocks"].append({
            "type": "text",
            "x": b["bbox"][0] / page_w,
            "y": b["bbox"][1] / page_h,
            "width": (b["bbox"][2] - b["bbox"][0]) / page_w,
            "height": (b["bbox"][3] - b["bbox"][1]) / page_h,
            "text": text_content,
            "font_size": max_font_size,
            "font_name": font_name,
            "role": role
        })


        # Blocchi immagini
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            ext = base_image.get("ext", "png")
            fname = f"page{page_num}_img{img_global_index}.{ext}"
            img_path = os.path.join(images_dir, fname)
            save_image(base_image, img_path)

            found_bbox = False
            for inst in page.get_image_info(xrefs=True):
                if inst.get("xref") == xref:
                    bbox = inst.get("bbox", [0,0,0,0])
                    x0, y0, x1, y1 = bbox
                    page_dict["blocks"].append({
                        "type": "image",
                        "x": 0 if not found_bbox else x0 / page_w,
                        "y": 0 if not found_bbox else y0 / page_h,
                        "width": 0 if not found_bbox else (x1 - x0) / page_w,
                        "height": 0 if not found_bbox else (y1 - y0) / page_h,
                        "path": os.path.join("images", fname),
                        "ext": ext,
                        "image_index": img_global_index,
                        "original_size": {"width": base_image.get("width", 0), "height": base_image.get("height", 0)},
                        "dpi": base_image.get("dpi", 300),
                        "format": ext
                    })

                    found_bbox = True

            if not found_bbox:
                page_dict["blocks"].append({
                    "type": "image",
                    "x": 0,
                    "y": 0,
                    "width": 0,
                    "height": 0,
                    "path": os.path.join("images", fname),
                    "ext": ext,
                    "image_index": img_global_index
                })

            img_global_index += 1

        page_dict["blocks"].sort(key=lambda b: (b["y"], b["x"]))
        pages_out.append(page_dict)

    out = {
        "pages": pages_out,
        "images_dir": images_dir,
        "units": "normalized"  # valori tra 0 e 1
    }

    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(out, ensure_ascii=False))

if __name__ == "__main__":
    main()
