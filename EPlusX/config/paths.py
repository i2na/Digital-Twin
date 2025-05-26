# config/paths.py

from pathlib import Path

class Paths:
    BASE_DIR = Path(__file__).resolve().parent.parent

    # ── 소스 파일 / 결과물 ─────────────────────────────
    RAW_PDF_DIR     = BASE_DIR / "raw_pdfs"
    SAMPLE_DIR      = BASE_DIR / "samples"
    EXTRACTED_DIR   = BASE_DIR / "extracted_texts"
    CHUNK_DIR       = BASE_DIR / "chunks"
    EMBED_DIR       = BASE_DIR / "embeddings"

    # ── 벡터 DB 관련 ────────────────────────────────────
    VECTOR_DB_DIR   = BASE_DIR / "vector_db"
    INDEX_PATH      = VECTOR_DB_DIR / "ep_hnsw.idx"
    IDMAP_PATH      = VECTOR_DB_DIR / "ep_id_map.json"

    # ── 파일 입력/출력 ─────────────────────────────────
    FILES_DIR       = BASE_DIR / "files"
    INPUT_EXCEL     = FILES_DIR / "building_info.xlsx"
    JSON_FILE       = FILES_DIR / "building_info.json"
    TEMPLATE_XLSX   = FILES_DIR / "energyplus_input_template.xlsx"

    # ── 스크립트 디렉토리 (옵션) ───────────────────────
    SCRIPTS_DIR     = BASE_DIR / "scripts"

    @staticmethod
    def ensure_dirs():
        """필요한 디렉토리를 생성"""
        for path in [
            Paths.RAW_PDF_DIR,
            Paths.SAMPLE_DIR,
            Paths.EXTRACTED_DIR,
            Paths.CHUNK_DIR,
            Paths.EMBED_DIR,
            Paths.VECTOR_DB_DIR,
            Paths.FILES_DIR,
            Paths.SCRIPTS_DIR,
        ]:
            path.mkdir(parents=True, exist_ok=True)

paths = Paths
