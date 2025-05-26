# -*- coding: utf-8 -*-
from pathlib import Path
from config import paths

paths.ensure_dirs()

paths.EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

def extract_pdf(path: Path) -> str:
    import pdfplumber
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t: text += t + "\n"
    return text

def extract_plain(path: Path) -> str:
    # IDF, HTML, HTM, RDD 전부 그냥 텍스트로 읽기
    return path.read_text(encoding="utf-8", errors="ignore")

def main():
    count = 0
    # 1) PDF
    for f in paths.RAW_PDF_DIR.glob("*.pdf"):
        print(f"[+] PDF 추출: {f.name}")
        txt = extract_pdf(f)
        (paths.EXTRACTED_DIR / f.name.replace(".pdf", ".txt")).write_text(txt, encoding="utf-8")
        count += 1
    # 2) samples 폴더: .html/.htm/.rdd/.idf
    for f in paths.SAMPLE_DIR.iterdir():
        if f.suffix.lower() in {".htm", ".rdd", ".idf"}:
            print(f"[+] 문서 추출: {f.name}")
            txt = extract_plain(f)
            (paths.EXTRACTED_DIR / f.name).with_suffix(".txt").write_text(txt, encoding="utf-8")
            count += 1

    print(f"[✓] 총 {count}개 문서를 텍스트로 저장 완료 → {paths.EXTRACTED_DIR}")

if __name__ == "__main__":
    main()
