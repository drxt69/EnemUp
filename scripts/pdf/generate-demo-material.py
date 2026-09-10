from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "materials" / "guia-rotina-enem.pdf"


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=16,
    )
    heading = ParagraphStyle(
        "Heading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0891b2"),
        spaceBefore=12,
        spaceAfter=8,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor("#334155"),
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Guia de rotina ENEM",
    )

    story = [
        Paragraph("Guia de Rotina ENEM", title),
        Paragraph(
            "Material demonstrativo autoral para organizar uma semana de estudos com foco em pratica, revisao e redacao.",
            body,
        ),
        Spacer(1, 12),
        Paragraph("Estrutura recomendada", heading),
        Paragraph(
            "Use blocos curtos e mensuraveis. Cada sessao deve terminar com correcao de erros, porque e ali que o estudo vira diagnostico.",
            body,
        ),
    ]

    table_data = [
        ["Bloco", "Duracao", "Objetivo"],
        ["Revisao ativa", "10 min", "Retomar formulas, conceitos ou repertorios sem copiar."],
        ["Pratica", "30 min", "Resolver questoes ou escrever um paragrafo de redacao."],
        ["Correcao", "10 min", "Anotar erro, causa e acao de revisao."],
    ]
    table = Table(table_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend([Spacer(1, 12), table])

    story.extend(
        [
            Paragraph("Checklist semanal", heading),
            Paragraph("- Resolver questoes de pelo menos 3 areas.", body),
            Paragraph("- Escrever ou revisar 1 redacao.", body),
            Paragraph("- Fazer 1 bloco de revisao espacada.", body),
            Paragraph("- Atualizar o plano com os erros mais frequentes.", body),
        ]
    )

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
