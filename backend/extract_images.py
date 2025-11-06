import sys, json, os
import fitz  # PyMuPDF
from PIL import Image, ImageOps, ImageStat
import io

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

pdf = fitz.open(pdf_path)
#lista per metadati img estratte
images = []

# Funzione per rilevare immagini troppo scure da invertire
def is_dark_image(img, threshold=100):
    grayscale = img.convert("L")
    stat = ImageStat.Stat(grayscale)
    return stat.mean[0] < threshold

#iterazione sulle pagine
for page_index, page in enumerate(pdf, start=1):
    image_list = page.get_images(full=True)

    #iterazione su ogni immagine raster embed (no vettoriali)
    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        #ritorna dizionario con info su img
        base_image = pdf.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"].lower()

        #apertura img dai bytes
        img = Image.open(io.BytesIO(image_bytes))

        # Conversione e inversione (non accurata)
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

        #salvataggio dell'immagine
        path = f"{output_dir}/page{page_index}_img{img_index}.png"
        img.save(path, "PNG")

        rects = []
        #ritorna le istanze di disegno sulle quali l'immagine (xref)
        # è usata nella pagina. ciascuna istanza contiene un bounding box
        for inst in page.get_image_info(xrefs=True):
            if inst["xref"] == xref:
                rects.append(inst["bbox"])

        #per ogni bounding box salvo coordinate,indice pagina, estensione, calcolo larghezza, lunghezza
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

#ordinamento sulla base di pagina, asse y e asse x, rispettivamente
images.sort(key=lambda x: (x["page"], x["y"], x["x"]))

print(json.dumps(images, ensure_ascii=False, indent=2))
