#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import subprocess
import shutil
import re
from pathlib import Path
import pandas as pd
from config.paths import paths

paths.ensure_dirs()

def convert_gbxml_to_idf(gbxml_path: Path, idf_output_path: Path):
    """
    gbXML2IDF 툴을 호출한 뒤, 폴더 안에 생성된 모든 .idf 파일 중
    'eplusrevit' 키워드를 포함한 파일(또는 최신 파일)을 골라
    idf_output_path 로 이동/이름 변경합니다.
    """
    repo_root = paths.BASE_DIR / "gbXML2IDF"
    converter = repo_root / "gbxmlconvertor.py"

    # 1) gbxmlconvertor.py 실행 (cwd=repo_root)
    subprocess.run([
        sys.executable,
        str(converter),
        "--input", str(gbxml_path),
        "--template", str(repo_root / "Template Files" / "IDF_template.idf"),
        "--schedule", str(repo_root / "Template Files" / "IDF_schedules.idf"),
    ], cwd=str(repo_root), check=True)

    # 바로 지정된 경로에 생성된 경우 우선 사용
    if idf_output_path.exists():
        return

    # 2) repo_root 폴더 및 하위에서 .idf 파일 전수 탐색
    candidates = list(repo_root.glob("*revit*.idf"))
    if not candidates:
        candidates = list(repo_root.glob("*.idf"))
    if not candidates:
        candidates = list(repo_root.rglob("*.idf"))
    if not candidates:
        raise FileNotFoundError(f"No .idf files found in {repo_root}")

    # 3) 가장 최근에 수정된 파일을 선택
    src = max(candidates, key=lambda p: p.stat().st_mtime)

    # 4) 최종 위치로 이동(덮어쓰기)
    shutil.move(str(src), str(idf_output_path))


def generate_web_idf(excel_path: Path, web_idf_path: Path):
    """
    Excel 'Web' 시트로부터 IDF 블록과 덮어쓰기 키를 생성합니다.
    반환값:
      - web_blocks: 생성된 IDF 블록 문자열 리스트
      - overrides: (클래스, 객체이름) 튜플 리스트
    """
    df = pd.read_excel(excel_path, sheet_name="Web")
    web_blocks = []
    overrides = []
    for idf_class, group in df.groupby("IDF 객체"):
        name = str(group.iloc[0]["값 입력(기본)"]).strip()
        overrides.append((idf_class, name))
        lines = [f"{idf_class},"]
        for i, (_, row) in enumerate(group.iterrows()):
            val = str(row["값 입력(기본)"]).strip()
            comment = f"!- {row['필드 설명']}"
            sep = ";" if i == len(group) - 1 else ","
            lines.append(f"  {val}{sep} {comment}")
        # 끝에 세미콜론 추가
        web_blocks.append("\n".join(lines) + "\n;")

    # web_idf 파일도 저장해 두면 디버깅에 편리합니다
    web_idf_path.write_text("\n\n".join(web_blocks), encoding="utf-8")
    return web_blocks, overrides


def merge_idf(base_idf: Path, web_blocks, overrides, final_idf: Path):
    """
    기본 IDF에서:
      - Web 시트에 해당하는 (클래스, 이름) 블록은 교체,
      - Web 시트에 새로 있는 블록은 추가,
      - 나머지 블록은 그대로 유지
    """
    text = base_idf.read_text(encoding="utf-8")
    # ";\n" 기준으로 분리 => 각 블록 끝에 세미콜론을 유지
    raw = text.split(";\n")
    base_blocks = [blk.strip() + ";" for blk in raw if blk.strip()]

    def parse_key(block: str):
        lines = block.splitlines()
        cls = lines[0].rstrip(",")
        name = None
        if len(lines) > 1:
            name = lines[1].strip().split(",")[0]
        return cls, name

    merged = []
    seen = set()

    # 1) 기존 블록 순회하며 Web 시트 키가 있으면 교체, 아니면 원본 유지
    for blk in base_blocks:
        key = parse_key(blk)
        if key in overrides:
            idx = overrides.index(key)
            merged.append(web_blocks[idx])
            seen.add(key)
        else:
            merged.append(blk)

    # 2) Web 시트에만 있고 base에는 없던 블록은 끝에 추가
    for idx, key in enumerate(overrides):
        if key not in seen:
            merged.append(web_blocks[idx])

    # 3) 최종 파일 쓰기
    final_idf.write_text("\n\n".join(merged), encoding="utf-8")

def main():
    gbxml     = paths.FILES_DIR / "model.xml"
    excel     = paths.FILES_DIR / "energyplus_input_template.xlsx"
    temp_idf  = paths.FILES_DIR / "model_from_gbxml.idf"
    web_idf   = paths.FILES_DIR / "web_input.idf"
    final_idf = paths.FILES_DIR / "final.idf"

    for p in (gbxml, excel):
        if not p.exists():
            print(f"Error: Not found: {p}", file=sys.stderr)
            sys.exit(1)

    print("1) Converting gbXML → IDF…")
    convert_gbxml_to_idf(gbxml, temp_idf)
    print(f"   -> {temp_idf.name}")

    print("2) Generating Web IDF blocks…")
    web_blocks, overrides = generate_web_idf(excel, web_idf)
    print(f"   -> {len(web_blocks)} blocks from Web sheet")

    print("3) Merging base + web overrides…")
    merge_idf(temp_idf, web_blocks, overrides, final_idf)
    print(f"   -> {final_idf.name}")
    print("Done. Final IDF ready at:", final_idf)

if __name__ == "__main__":
    main()