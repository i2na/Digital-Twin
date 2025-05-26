#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import numpy as np
import hnswlib
from config import paths

paths.ensure_dirs()

paths.INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)

def main():
    # 1) 임베딩 벡터와 ids 로드
    vectors = []
    ids      = []
    if not paths.EMBED_DIR.exists() or not any(paths.EMBED_DIR.iterdir()):
        raise RuntimeError(f"❌ '{paths.EMBED_DIR}' 가 비어있거나 존재하지 않습니다. 먼저 embed_chunks.py 를 실행하세요.")

    for fn in paths.EMBED_DIR.glob("*.jsonl"):
        with open(fn, "r", encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line)
                vectors.append(rec["embedding"])
                ids.append(rec["id"])

    if not vectors:
        raise RuntimeError("❌ 임베딩 벡터가 하나도 없습니다. 먼저 embed_chunks.py 를 실행하세요.")

    # 2) numpy 배열로 변환 및 차원 확인
    vectors = np.array(vectors, dtype="float32")
    dim     = vectors.shape[1]
    print(f"[+] HNSW index 생성 (dim={dim}, items={len(vectors)})")

    # 3) HNSW 인덱스 구성
    p = hnswlib.Index(space="l2", dim=dim)
    p.init_index(max_elements=len(vectors), ef_construction=200, M=16)
    p.add_items(vectors, np.arange(len(vectors)))
    p.set_ef(50)

    # 4) 디스크에 저장
    p.save_index(str(paths.INDEX_PATH))
    with open(paths.IDMAP_PATH, "w", encoding="utf-8") as f:
        json.dump(ids, f, ensure_ascii=False, indent=2)

    print(f"[✓] HNSW 인덱스 생성 완료: {len(ids)} vectors → {paths.INDEX_PATH}")

if __name__ == "__main__":
    main()
