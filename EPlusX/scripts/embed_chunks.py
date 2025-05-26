#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, json
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from config import paths

paths.ensure_dirs()

load_dotenv()
client = OpenAI()

paths.EMBED_DIR.mkdir(exist_ok=True)

def read_chunks(chunk_path: Path):
    raw = chunk_path.read_text(encoding="utf-8", errors="ignore")
    parts = raw.strip().split("[Chunk ")
    out = []
    for idx, part in enumerate(parts[1:], start=0):
        text = part.split("]",1)[1].strip()
        if text:
            out.append({"id": f"{chunk_path.name}_chunk{idx}", "text": text})
    return out

def main():
    chunk_files = list(paths.CHUNK_DIR.glob("*.chunks.txt"))
    if not chunk_files:
        raise RuntimeError(f"❌ 임베딩 실패: {paths.CHUNK_DIR}/*.chunks.txt 가 없습니다.")
    print(f"[+] {len(chunk_files)}개 청크 파일 발견, 임베딩 시작")

    for cf in chunk_files:
        out_path = paths.EMBED_DIR / cf.name.replace(".chunks.txt", ".jsonl")
        print(f"[+] Embedding: {cf.name}")

        chunks = read_chunks(cf)
        with open(out_path, "w", encoding="utf-8") as writer:
            for c in chunks:
                try:
                    res = client.embeddings.create(
                        model="text-embedding-3-large",
                        input=c["text"]
                    )
                    c["embedding"] = res.data[0].embedding
                    writer.write(json.dumps(c, ensure_ascii=False) + "\n")
                except Exception as e:
                    print(f"[❌] 임베딩 오류 ({c['id']}): {e}")

        print(f"[✓] 저장 완료: {out_path.name}")

if __name__ == "__main__":
    main()
