import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


DEFAULT_URL = "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos"
ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "data" / "enem-imports" / "discovered-assets.json"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._current_href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            attrs_dict = dict(attrs)
            self._current_href = attrs_dict.get("href")
            self._text = []

    def handle_data(self, data):
        if self._current_href:
            self._text.append(data.strip())

    def handle_endtag(self, tag):
        if tag == "a" and self._current_href:
            self.links.append(
                {
                    "href": self._current_href,
                    "text": " ".join(part for part in self._text if part),
                }
            )
            self._current_href = None
            self._text = []


def guess_year(value):
    match = re.search(r"(20\d{2}|19\d{2})", value)
    return int(match.group(1)) if match else None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--limit", type=int, default=40)
    args = parser.parse_args()

    request = Request(args.url, headers={"User-Agent": "ProjetoENEMImporter/1.0"})
    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="ignore")

    parser_html = LinkParser()
    parser_html.feed(html)

    assets = []
    for item in parser_html.links:
        href = urljoin(args.url, item["href"])
        lowered = href.lower()
        text = item["text"] or href.rsplit("/", 1)[-1]

        if not any(ext in lowered for ext in [".pdf", ".zip"]):
            continue

        if not any(token in f"{text} {href}".lower() for token in ["enem", "prova", "gabarito", "caderno"]):
            continue

        assets.append(
            {
                "title": text[:180],
                "sourceUrl": href,
                "assetType": "ZIP" if ".zip" in lowered else "PDF",
                "year": guess_year(f"{text} {href}"),
            }
        )

    deduped = []
    seen = set()
    for asset in assets:
        if asset["sourceUrl"] not in seen:
            deduped.append(asset)
            seen.add(asset["sourceUrl"])

    if not deduped:
        deduped = [
            {
                "title": "Fonte oficial INEP - preencher URL direta de prova ou gabarito",
                "sourceUrl": args.url,
                "assetType": "HTML_SOURCE",
                "year": None,
            }
        ]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
      json.dumps(deduped[: args.limit], ensure_ascii=False, indent=2),
      encoding="utf-8",
    )
    print(f"Discovered {len(deduped[: args.limit])} official assets -> {OUTPUT}")


if __name__ == "__main__":
    main()
