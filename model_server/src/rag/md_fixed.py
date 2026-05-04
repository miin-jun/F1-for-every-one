import pymupdf
import re
import os
from glob import glob

def pdf_to_structured_md(pdf_path: str, output_path: str):
    doc = pymupdf.open(pdf_path)
    lines = []

    for page in doc:
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if block["type"] != 0:
                continue

            for line in block["lines"]:
                # 라인의 텍스트와 굵기 정보 수집
                spans = line["spans"]
                if not spans:
                    continue

                text = "".join(s["text"] for s in spans).strip()
                if not text:
                    continue

                # 페이지 마커 제거 (B1, C96, B35 등)
                if re.match(r'^[A-Z]\d+$', text):
                    continue
                # 푸터/헤더 제거
                if "Fédération Internationale" in text:
                    continue
                if re.match(r'^\d{1,2}\s+\w+\s+\d{4}$', text):
                    continue
                if re.match(r'^Issue\s+\d+$', text):
                    continue
                if "Formula 1:" in text and "Regulations" in text:
                    continue

                # 굵은 텍스트 여부 확인
                is_bold = any(
                    "Bold" in s.get("font", "") or s.get("flags", 0) & 2**4
                    for s in spans
                )
                font_size = max(s.get("size", 0) for s in spans)

                # ARTICLE 헤더 (가장 큰 단위)
                if re.match(r'^ARTICLE\s+[A-Z]\d+:', text):
                    lines.append(f"\n# {text}\n")

                # 조항 번호 B1.1, B7.2.3 등 → ## 헤더
                elif re.match(r'^[A-Z]\d+\.\d+(\.\d+)?\s+\S', text) and is_bold:
                    lines.append(f"\n## {text}\n")

                # APPENDIX 헤더
                elif re.match(r'^APPENDIX\s+', text) and is_bold:
                    lines.append(f"\n# {text}\n")

                else:
                    lines.append(text)

    doc.close()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"완료: {output_path}")


# 실행
pdf_dir = "../../data/rag/raw"
os.makedirs(f"{pdf_dir}/preprocessed", exist_ok=True)

for pdf_file in glob(f"{pdf_dir}/*.pdf"):
    out_path = pdf_file.replace(".pdf", "_structured.md").replace("/raw/", "/raw/preprocessed/")
    pdf_to_structured_md(pdf_file, out_path)