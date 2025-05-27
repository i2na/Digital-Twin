# config/paths.py

from pathlib import Path

class Paths:
    BASE_DIR = Path(__file__).resolve().parent.parent

    RAW_PDF_DIR     = BASE_DIR / "raw_pdfs"
    SAMPLE_DIR      = BASE_DIR / "samples"
    EXTRACTED_DIR   = BASE_DIR / "extracted_texts"
    CHUNK_DIR       = BASE_DIR / "chunks"
    EMBED_DIR       = BASE_DIR / "embeddings"

    VECTOR_DB_DIR   = BASE_DIR / "vector_db"
    INDEX_PATH      = VECTOR_DB_DIR / "ep_hnsw.idx"
    IDMAP_PATH      = VECTOR_DB_DIR / "ep_id_map.json"

    FILES_DIR       = BASE_DIR / "files"
    INPUT_EXCEL     = FILES_DIR / "building_info.xlsx"
    JSON_FILE       = FILES_DIR / "building_info.json"
    TEMPLATE_XLSX   = FILES_DIR / "energyplus_input_template.xlsx"

    SCRIPTS_DIR     = BASE_DIR / "scripts"
    
    OPENSTUDIO_DIR = BASE_DIR / 'openstudio'

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
