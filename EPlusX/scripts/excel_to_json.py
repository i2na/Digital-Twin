# -*- coding: utf-8 -*-
import pandas as pd, json, sys
from pathlib import Path

def excel_to_json(xlsx, out):
    df = pd.read_excel(xlsx)
    info = { str(r['항목']).strip(): str(r['예시 입력값']).strip()
             for _,r in df.iterrows() }
    json.dump(info, open(out,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"[✓] Excel→JSON: {out}")

if __name__=="__main__":
    if len(sys.argv)!=3:
        print("Usage: python excel_to_json.py input.xlsx output.json"); exit(1)
    excel_to_json(Path(sys.argv[1]), Path(sys.argv[2]))
