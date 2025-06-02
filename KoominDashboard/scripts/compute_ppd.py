#!/usr/bin/env python3
import sys
import json
import warnings
import math
from pythermalcomfort.models.pmv_ppd import pmv_ppd

def compute_pmv_ppd(ta: float, tr: float, rh: float, met: float, clo: float):
    result = pmv_ppd(
        tdb=ta,
        tr=tr,
        vr=0.1,
        rh=rh,
        met=met,
        clo=clo,
        standard="ASHRAE"
    )
    pmv_raw = result.get("pmv", 0.0)
    ppd_raw = result.get("ppd", 0.0)

    if pmv_raw is None or math.isnan(pmv_raw):
        pmv = 0.0
    else:
        pmv = round(pmv_raw, 3)

    if ppd_raw is None or math.isnan(ppd_raw):
        ppd = 0.0
    else:
        ppd = round(ppd_raw, 1)

    return {
        "pmv": pmv,
        "ppd": ppd
    }

if __name__ == "__main__":
    warnings.filterwarnings("ignore")

    try:
        args = json.loads(sys.argv[1])
        ta = args["ta"]
        tr = args["tr"]
        rh = args["rh"]
        met = args["met"]
        clo = args["clo"]

        output = compute_pmv_ppd(ta, tr, rh, met, clo)

        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        sys.stderr.write(f"ERROR: {e}")
        sys.exit(1)
