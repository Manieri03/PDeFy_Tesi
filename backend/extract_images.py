import sys, json, os
import fitz  # PyMuPDF
from PIL import Image, ImageOps, ImageStat
import io

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

pdf = fitz.open(pdf_path)
images = []

# Funzione per rilevare immagini troppo scure (testo bianco su sfondo nero)
def is_dark_image(img, threshold=100):
    grayscale = img.convert("L")
    stat = ImageStat.Stat(grayscale)
    return stat.mean[0] < threshold

for page_index, page in enumerate(pdf, start=1):
    image_list = page.get_images(full=True)

    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = pdf.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"].lower()

        img = Image.open(io.BytesIO(image_bytes))

        # Conversione e inversione intelligente
        if img.mode in ["L", "1"]:
            if is_dark_image(img):
                img = ImageOps.invert(img.convert("L"))
            else:
                img = img.convert("L")
        elif img.mode == "CMYK":
            img = img.convert("RGB")
        elif img.mode == "RGB":
            if is_dark_image(img):
                img = ImageOps.invert(img)

        path = f"{output_dir}/page{page_index}_img{img_index}.png"
        img.save(path, "PNG")

        rects = []
        for inst in page.get_image_info(xrefs=True):
            if inst["xref"] == xref:
                rects.append(inst["bbox"])

        for rect in rects:
            x0, y0, x1, y1 = rect
            images.append({
                "page": page_index,
                "path": path,
                "ext": "png",
                "bbox": rect,
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0
            })

pdf.close()

images.sort(key=lambda x: (x["page"], x["y"], x["x"]))

print(json.dumps(images, ensure_ascii=False, indent=2))
