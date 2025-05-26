#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from pathlib import Path
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from config import paths

paths.ensure_dirs()

paths.CHUNK_DIR.mkdir(exist_ok=True)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

def main():
    txt_files = list(paths.EXTRACTED_DIR.glob("*.txt"))
    if not txt_files:
        raise RuntimeError(f"❌ 청크 분할 실패: {paths.EXTRACTED_DIR}/*.txt 가 없습니다.")
    print(f"[+] {len(txt_files)}개 텍스트 파일 발견, 청크 분할 시작")

    for txt in txt_files:
        text = txt.read_text(encoding="utf-8", errors="ignore")
        doc = Document(page_content=text, metadata={"source": txt.name})
        chunks = splitter.split_documents([doc])

        out_path = paths.CHUNK_DIR / txt.name.replace(".txt", ".chunks.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            for i, c in enumerate(chunks):
                f.write(f"[Chunk {i}]\n{c.page_content}\n\n")

        print(f"[+] 청크 생성: {out_path.name}")

if __name__ == "__main__":
    main()
