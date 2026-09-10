import argparse
import json
import re
import shutil
import zipfile
from pathlib import Path
from urllib.request import Request, urlopen

import pdfplumber


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "enem-imports"
DISCOVERED = DATA_DIR / "discovered-assets.json"
EXTRACTED = DATA_DIR / "extracted-drafts.json"
DOWNLOADS = DATA_DIR / "downloads"
LOCAL_ARCHIVES = DATA_DIR / "local-archives"


def safe_name(value):
    value = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-")
    return value[:140] or "asset"


def download(url, out):
    request = Request(url, headers={"User-Agent": "ProjetoENEMImporter/1.0"})
    with urlopen(request, timeout=60) as response:
        out.write_bytes(response.read())


def extract_pdf_text(pdf_path, max_pages):
    pages = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for index, page in enumerate(pdf.pages[:max_pages], start=1):
            text = extract_page_text(page)
            if text.strip():
                pages.append({"page": index, "text": text})
    return pages


def extract_page_text(page):
    marker = re.compile(r"quest\S{0,4}o\s*\d{1,3}", re.IGNORECASE)
    full_text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
    width = page.width
    height = page.height
    left_text = page.crop((0, 0, width / 2, height)).extract_text(x_tolerance=2, y_tolerance=3) or ""
    right_text = page.crop((width / 2, 0, width, height)).extract_text(x_tolerance=2, y_tolerance=3) or ""

    if marker.search(left_text) and marker.search(right_text):
        return "\n".join([left_text, right_text])

    return full_text


def infer_asset_from_path(pdf_path, source_url):
    title = pdf_path.stem
    normalized = title.lower()
    match = re.search(r"enem[_\s-]*(20\d{2})[_\s-]*(\d)", normalized)
    year = int(match.group(1)) if match else None
    day = int(match.group(2)) if match else None
    kind = "GABARITO" if "gabarito" in normalized else "PROVA"

    return {
        "title": title,
        "sourceUrl": source_url,
        "assetType": f"PDF_{kind}",
        "year": year,
        "day": day,
    }


def safe_extract_zip(zip_path, target_dir):
    extracted = []
    target_dir.mkdir(parents=True, exist_ok=True)
    target_root = target_dir.resolve()

    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            if member.is_dir():
                continue

            destination = (target_dir / member.filename).resolve()
            if target_root not in destination.parents and destination != target_root:
                raise ValueError(f"Unsafe zip entry skipped: {member.filename}")

            destination.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as source, destination.open("wb") as output:
                shutil.copyfileobj(source, output)
            extracted.append(destination)

    return extracted


def build_local_assets(local_archive):
    archive_path = Path(local_archive).expanduser().resolve()
    if not archive_path.exists():
        raise FileNotFoundError(f"Local archive not found: {archive_path}")

    target_dir = LOCAL_ARCHIVES / safe_name(archive_path.stem)
    extracted = safe_extract_zip(archive_path, target_dir)
    pdfs = sorted([path for path in extracted if path.suffix.lower() == ".pdf"])

    assets = []
    for pdf_path in pdfs:
        relative = pdf_path.relative_to(ROOT)
        assets.append(
            {
                **infer_asset_from_path(pdf_path, f"local://{archive_path.name}/{relative.as_posix()}"),
                "localPath": str(relative),
            }
        )
    return assets


def question_marker_pattern():
    return re.compile(r"(?=(?:quest\S{0,4}o)\s*\d{1,3})", re.IGNORECASE)


def split_question_blocks(text):
    chunks = [chunk.strip() for chunk in question_marker_pattern().split(text) if chunk.strip()]
    useful = []
    for chunk in chunks:
        if len(chunk) < 120:
            continue
        useful.append(chunk[:5000])
    return useful


def guess_question_number(block):
    match = re.search(
        r"(?:quest\S{0,4}o)\s*(\d{1,3})",
        block,
        re.IGNORECASE,
    )
    if match:
        return int(match.group(1))
    match = re.match(r"\s*(\d{1,3})\s*[.)-]", block)
    return int(match.group(1)) if match else None


def parse_answer_key(text):
    answers = {}
    for raw_line in text.splitlines():
        tokens = raw_line.strip().split()
        pairs = []
        index = 0
        while index + 1 < len(tokens):
            number = re.sub(r"\D", "", tokens[index])
            label = tokens[index + 1].upper()[:1]
            if number.isdigit() and label in ["A", "B", "C", "D", "E"]:
                pairs.append((int(number), label))
                index += 2
            else:
                index += 1

        for number, label in pairs:
            if 1 <= number <= 180 and number not in answers:
                answers[number] = label
    return answers


def answer_lookup_key(asset):
    return (asset.get("year"), asset.get("day"))


def load_answer_keys(assets, max_pages):
    keys = {}
    for asset in assets:
        if asset.get("assetType") != "PDF_GABARITO":
            continue
        local_path = asset.get("localPath")
        if not local_path:
            continue
        pdf_path = ROOT / local_path
        page_texts = extract_pdf_text(pdf_path, max_pages)
        text = "\n".join(page["text"] for page in page_texts)
        parsed = parse_answer_key(text)
        if parsed:
            keys[answer_lookup_key(asset)] = parsed
    return keys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=3)
    parser.add_argument("--max-pages", type=int, default=8)
    parser.add_argument("--gabarito-pages", type=int, default=3)
    parser.add_argument("--assets", default=str(DISCOVERED))
    parser.add_argument("--local-archive")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)

    if args.local_archive:
        assets = build_local_assets(args.local_archive)
        asset_out = DATA_DIR / "local-assets.json"
        asset_out.write_text(json.dumps(assets, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Discovered {len(assets)} local PDF assets -> {asset_out}")
    else:
        assets = json.loads(Path(args.assets).read_text(encoding="utf-8"))

    answer_keys = load_answer_keys(assets, args.gabarito_pages)
    selected_assets = assets[: args.limit]

    drafts = []
    for asset in selected_assets:
        url = asset["sourceUrl"]
        if asset["assetType"] not in ["PDF", "ZIP", "PDF_PROVA", "PDF_GABARITO"]:
            continue
        if asset["assetType"] == "PDF_GABARITO":
            continue

        suffix = ".zip" if asset["assetType"] == "ZIP" else ".pdf"
        if asset.get("localPath"):
            local = ROOT / asset["localPath"]
        else:
            local = DOWNLOADS / f"{safe_name(asset['title'])}{suffix}"
            if not local.exists():
                download(url, local)

        pdfs = []
        if suffix == ".zip":
            target_dir = DOWNLOADS / local.stem
            pdfs = safe_extract_zip(local, target_dir)
            pdfs = [path for path in pdfs if path.suffix.lower() == ".pdf"]
        else:
            pdfs = [local]

        for pdf_path in pdfs:
            page_texts = extract_pdf_text(pdf_path, args.max_pages)
            blocks = split_question_blocks("\n".join(page["text"] for page in page_texts))
            answer_key = answer_keys.get(answer_lookup_key(asset), {})
            for index, block in enumerate(blocks, start=1):
                extracted_number = guess_question_number(block)
                answer_label = answer_key.get(extracted_number) if extracted_number else None
                drafts.append(
                    {
                        "source": {
                            **asset,
                            "localPath": str(pdf_path.relative_to(ROOT)),
                        },
                        "questionNumber": index,
                        "externalRef": str(extracted_number) if extracted_number else None,
                        "answerLabel": answer_label,
                        "rawText": block,
                        "status": "EXTRACTED_NEEDS_REVIEW",
                        "confidence": 0.55 if answer_label else 0.4,
                    }
                )

    EXTRACTED.write_text(json.dumps(drafts, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(drafts)} draft blocks -> {EXTRACTED}")


if __name__ == "__main__":
    main()
