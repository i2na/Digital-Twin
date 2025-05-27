#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import subprocess
from config import paths

paths.ensure_dirs()

def run(cmd: str, desc: str):
    print(f"\n[+] {desc}...")
    env = os.environ.copy()
    env["PYTHONPATH"] = "."  # PYTHONPATH 설정
    subprocess.run(cmd, shell=True, check=True, env=env)

def main():
    # 1) 문서 → 텍스트 추출
    if not paths.EXTRACTED_DIR.exists() or not any(paths.EXTRACTED_DIR.iterdir()):
        run("python scripts/extract_documents.py",
            "문서(PDF·HTML·HTM·RDD·IDF) → 텍스트 추출")
    else:
        print("[✓] extracted_texts 폴더에 이미 텍스트가 있습니다. 스킵")

    # 2) 텍스트 → 청크 분할
    if not paths.CHUNK_DIR.exists() or not any(paths.CHUNK_DIR.iterdir()):
        run("python scripts/chunk_texts.py", "텍스트 → 청크 분할")
    else:
        print("[✓] chunks 폴더에 이미 청크가 있습니다. 스킵")

    # 3) 청크 → 임베딩 생성
    if not paths.EMBED_DIR.exists() or not any(paths.EMBED_DIR.iterdir()):
        run("python scripts/embed_chunks.py", "청크 → 임베딩 생성")
    else:
        print("[✓] embeddings 폴더에 이미 임베딩이 있습니다. 스킵")

    # 4) HNSW 인덱스 생성
    if not paths.INDEX_PATH.exists():
        run("python scripts/build_hnsw_index.py", "HNSW 인덱스 생성")
    else:
        print("[✓] HNSW 인덱스(ep_hnsw.idx) 이미 존재. 스킵")

    # 5) Excel → JSON
    if not paths.JSON_FILE.exists():
        if paths.INPUT_EXCEL.exists():
            run(f"python scripts/excel_to_json.py {paths.INPUT_EXCEL} {paths.JSON_FILE}",
                "엑셀 → JSON 변환")
        else:
            print(f"[!] {paths.INPUT_EXCEL} 파일을 찾을 수 없습니다")
    else:
        print("[✓] building_info.json 이미 존재. 스킵")

    # 6) GPT 질의 & 엑셀 템플릿 생성
    if not paths.TEMPLATE_XLSX.exists():
        if paths.JSON_FILE.exists():
            run(f"python scripts/query_from_json.py {paths.JSON_FILE}",
                "GPT-4o 질의 → 엑셀 템플릿 생성")
        else:
            print("[!] building_info.json 없음 — 5단계를 먼저 수행하세요")
    else:
        print("[✓] energyplus_input_template.xlsx 이미 존재. 스킵")

if __name__ == "__main__":
    main()
