#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json, re
import numpy as np
import pandas as pd
import hnswlib
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
from config import paths

paths.ensure_dirs()

# OpenAI 초기화
load_dotenv()
client = OpenAI()

EMBED_MODEL = "text-embedding-3-large"
GPT_MODEL   = "gpt-4o"

# ─── 1) HNSW 인덱스 로드 ────────────────────────
print("[+] HNSW 인덱스 로드:", paths.INDEX_PATH)
if not paths.INDEX_PATH.exists():
    raise FileNotFoundError(f"❌ 인덱스 파일이 없습니다: {paths.INDEX_PATH}")
p = hnswlib.Index(space="l2", dim=1)
p.load_index(str(paths.INDEX_PATH))
with open(paths.IDMAP_PATH, "r", encoding="utf-8") as f:
    id_map = json.load(f)

# ─── 2) 임베딩된 청크 로드 ────────────────────
id2text = {}
for fn in paths.EMBED_DIR.iterdir():
    if fn.suffix == ".jsonl":
        for line in fn.read_text(encoding="utf-8").splitlines():
            rec = json.loads(line)
            id2text[rec["id"]] = rec["text"]

# ─── 3) 엑셀 → dict ───────────────────────────
def excel_to_dict(path: Path) -> dict:
    df = pd.read_excel(path)
    return {
        str(r["항목"]).strip(): str(r["예시 입력값"]).strip()
        for _, r in df.iterrows()
    }

# ─── 4) RAG 검색 ───────────────────────────────
def search_chunks(query: str, top_k: int = 8) -> list[str]:
    qvec = client.embeddings.create(model=EMBED_MODEL, input=query).data[0].embedding
    labels, _ = p.knn_query(np.array([qvec], dtype="float32"), k=top_k)
    return [ id2text.get(id_map[idx], "") for idx in labels[0] ]

# ─── 5) Prompt 생성 ────────────────────────────
def build_prompt(info: dict) -> str:
    header = (
        "다음은 건물 기본정보입니다. 이 정보를 바탕으로 EnergyPlus에 필요한 모든 IDF 객체를\n"
        "JSON 리스트 포맷으로 **빠짐없이** 제안해주세요.\n\n"
        "📌 **source 분류 기준** 📌\n"
        "- **Revit**: Revit 모델(Geometry, Zone, Surface, Construction, Material 등)에서 자동 생성 가능한 객체\n"
        "- **Web**: Revit에 없는, 수작업으로 추가해야 하는 Simulation-control, Schedule, Output 등 객체\n\n"
        "🔧 **출력 스펙** 🔧\n"
        "각 객체마다 다음 속성을 포함해야 합니다:\n"
        "1. idf_class (string)\n"
        "2. reason   (string)\n"
        "3. fields   (array of objects):\n"
        "      [ {\"name\":string, \"description\":string, \"default\":string}, ... ]\n"
        "4. source   (\"Revit\" 또는 \"Web\")\n\n"
        "📝 **예시**\n"
        "```json\n"
        "[\n"
        "  {\n"
        "    \"idf_class\": \"Building\",\n"
        "    \"reason\": \"건물 기본 정보 정의\",\n"
        "    \"fields\": [\n"
        "      {\"name\":\"Name\",\"description\":\"건물 이름\",\"default\":\"\"},\n"
        "      {\"name\":\"North Axis\",\"description\":\"북쪽 회전각\",\"default\":\"0\"}\n"
        "    ],\n"
        "    \"source\": \"Web\"\n"
        "  }\n"
        "]\n"
        "```\n\n"
        "입력 정보:\n"
    )
    body = "\n".join(f"{k}: {v}" for k, v in info.items())
    return header + body

# ─── 6) GPT 호출 ───────────────────────────────
def ask_gpt(prompt: str, docs: list[str]) -> str:
    messages = [
        {"role": "system",  "content": "You are an EnergyPlus IDF expert."},
        {"role": "system",  "content": "참고 문서:\n\n" + "\n\n".join(docs)},
        {"role": "user",    "content": prompt}
    ]
    resp = client.chat.completions.create(model=GPT_MODEL, messages=messages)
    return resp.choices[0].message.content

# ─── 7) 응답에서 JSON만 추출 ───────────────────
def extract_json(text: str) -> str:
    m = re.search(r"```json\s*(.*?)```", text, re.DOTALL)
    payload = m.group(1) if m else text
    # C++ 스타일 주석 제거
    payload = re.sub(r"//.*", "", payload)
    return payload.strip()

# ─── 8) 엑셀 템플릿 저장 ───────────────────────
def save_to_excel(objs: list[dict], out: Path=paths.TEMPLATE_XLSX):
    rev, web = [], []
    for o in objs:
        for f in o.get("fields", []):
            row = {
                "IDF 객체":      o.get("idf_class",""),
                "필요 이유":      o.get("reason",""),
                "필드 이름":      f.get("name",""),
                "필드 설명":      f.get("description",""),
                "값 입력(기본)": f.get("default","")
            }
            if o.get("source","").lower() == "revit":
                rev.append(row)
            else:
                web.append(row)

    with pd.ExcelWriter(out, engine="openpyxl") as w:
        pd.DataFrame(rev).to_excel(w, sheet_name="Revit", index=False)
        pd.DataFrame(web).to_excel(w, sheet_name="Web", index=False)

    print(f"[🎉] 엑셀 템플릿 생성 완료 → {out}")

# ─── 9) main ───────────────────────────────────
def main():
    info    = excel_to_dict(paths.INPUT_EXCEL)
    prompt  = build_prompt(info)
    docs    = search_chunks(prompt, top_k=8)
    print(f"[🔎] 검색된 문서 개수: {len(docs)}")
    answer  = ask_gpt(prompt, docs)

    try:
        payload = extract_json(answer)
        objs    = json.loads(payload)
        save_to_excel(objs)
    except Exception as e:
        print("⚠️ 처리 중 오류:", e)
        print("▶︎ GPT 응답 원본:\n", answer)

if __name__ == "__main__":
    main()
