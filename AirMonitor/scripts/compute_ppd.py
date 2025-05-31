#!/usr/bin/env python3
import sys
import json

# pythermalcomfort v2.x에서 pmv_ppd 함수를 가져오기
from pythermalcomfort.models.pmv_ppd import pmv_ppd


def compute_pmv_ppd(ta: float, tr: float, rh: float, met: float, clo: float):
    """
    PMV/PPD 계산 (pythermalcomfort v2.x 사용, ASHRAE 55 기준)
    """
    result = pmv_ppd(
        tdb=ta,
        tr=tr,
        vr=0.1,           # 교실 기준 자연 환기
        rh=rh,
        met=met,
        clo=clo,
        standard="ASHRAE"
    )
    # 소수점 처리 후 반환
    return {
        "pmv": round(result["pmv"], 3),
        "ppd": round(result["ppd"], 1)
    }


if __name__ == "__main__":
    """
    사용 예시:
      python3 scripts/pmv_ppd.py '{"ta":22.5,"tr":22.5,"rh":50,"met":1.0,"clo":0.5}'
    """
    args = json.loads(sys.argv[1])
    ta = args["ta"]
    tr = args["tr"]
    rh = args["rh"]
    met = args["met"]
    clo = args["clo"]

    output = compute_pmv_ppd(ta, tr, rh, met, clo)
    print(json.dumps(output, ensure_ascii=False))
