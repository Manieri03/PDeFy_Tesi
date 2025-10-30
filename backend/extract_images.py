import sys, json, os
import fitz  # PyMuPDF

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

pdf = fitz.open(pdf_path)
images = []

for page_index, page in enumerate(pdf, start=1):
    image_list = page.get_images(full=True)


    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        base_image = pdf.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        path = f"{output_dir}/page{page_index}_img{img_index}.{ext}"

        with open(path, "wb") as f:
            f.write(image_bytes)


        rects = []
        for inst in page.get_image_info(xrefs=True):
            if inst["xref"] == xref:
                rect = inst["bbox"]
                rects.append(rect)

        for rect in rects:
            x0, y0, x1, y1 = rect
            images.append({
                "page": page_index,
                "path": path,
                "ext": ext,
                "bbox": rect,
                "x": x0,
                "y": y0,
                "width": x1 - x0,
                "height": y1 - y0
            })

pdf.close()

images.sort(key=lambda x: (x["page"], x["y"], x["x"]))


print(json.dumps(images, ensure_ascii=False, indent=2))
