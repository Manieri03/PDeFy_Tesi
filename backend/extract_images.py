import sys, json
import fitz, os

pdf_path = sys.argv[1]
output_dir = sys.argv[2]

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

pdf = fitz.open(pdf_path)
images = []
for page_index in range(len(pdf)):
    page = pdf[page_index]
    for img_index, img in enumerate(page.get_images(full=True), start=1):
        xref = img[0]
        base_image = pdf.extract_image(xref)
        image_bytes = base_image["image"]
        ext = base_image["ext"]
        path = f"{output_dir}/page{page_index+1}_img{img_index}.{ext}"
        with open(path, "wb") as f:
            f.write(image_bytes)
        images.append({"page": page_index+1, "path": path, "ext": ext})
pdf.close()
images.sort(key=lambda x: (x["page"], x["path"]))
print(json.dumps(images))
