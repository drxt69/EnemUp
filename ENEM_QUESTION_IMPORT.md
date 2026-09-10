# Importação De Questões ENEM

O banco atual está preparado para armazenar questões do ENEM por ano, prova,
área, disciplina, assunto, dificuldade, alternativas, gabarito, explicação e
status legal.

## Fonte oficial

Use somente fontes oficiais ou licenciadas. A fonte prioritaria e o INEP/Gov.br:

- Provas e gabaritos oficiais: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
- Microdados do ENEM: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem

## Pipeline recomendado

1. Baixar provas e gabaritos oficiais.
2. Registrar ano, dia, caderno/cor, idioma e URL de origem.
3. Extrair texto e imagens dos PDFs.
4. Separar enunciado, textos de apoio, alternativas e gabarito.
5. Revisar manualmente questões com imagem, tabela, gráfico ou fórmula.
6. Classificar área, disciplina, assunto e dificuldade.
7. Salvar com `legalStatus = "OFFICIAL_INEP_REVIEWED"`.
8. Publicar apenas após revisão.

## Automacao criada no projeto

Descobrir assets oficiais:

```bash
npm run enem:discover -- --limit 40
```

Baixar e extrair rascunhos:

```bash
npm run enem:extract -- --limit 2 --max-pages 8
```

Salvar rascunhos no banco:

```bash
npm run enem:save-drafts
```

Extrair um ZIP local com provas e gabaritos:

```bash
npm run enem:extract-local -- "E:\ENEM.zip" --limit 68 --max-pages 120 --gabarito-pages 3
npm run enem:save-drafts
npm run enem:publish-drafts
```

Rodar o fluxo pequeno completo:

```bash
npm run enem:import
```

Os rascunhos aparecem no admin em `/admin/enem-sources`.

Se seu Python local não tiver `pdfplumber`, instale:

```bash
python -m pip install pdfplumber
```

Ou defina `PYTHON_IMPORTER` apontando para um Python que já tenha
`pdfplumber`.

Se a pagina oficial não expuser links diretos no HTML, baixe/copiei as URLs
diretas dos PDFs oficiais do INEP e salve em um JSON no formato de
`data/enem-imports/manual-assets.example.json`. Depois rode:

```bash
npm run enem:extract -- --assets data/enem-imports/manual-assets.json --limit 2 --max-pages 8
npm run enem:save-drafts
```

## Por que não inserir tudo manualmente agora

As provas completas têm milhares de questões, muitas com imagens, gráficos,
tabelas e textos de apoio. Importar sem revisão cria risco de erro pedagógico,
gabarito incorreto e problema de origem. A arquitetura já está pronta; a etapa
seguinte ideal e construir o importador assistido com fila de revisão no admin.
