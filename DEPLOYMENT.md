# Deploy

Este projeto e somente um aplicativo web. Não exige maquina virtual, emulador,
container ou alteracao do Windows.

## Status atual

O desenvolvimento local usa SQLite em `prisma/dev.db`. Isso e excelente para
começar sem custo e sem instalar banco local, mas não é a melhor escolha para
deploy serverless.

## Caminho recomendado com custo zero/free tier

1. Hospedar o app Next.js na Vercel Hobby.
2. Migrar o banco de SQLite para PostgreSQL em Neon Free ou Supabase Free.
3. Configurar variaveis de ambiente no painel da hospedagem.
4. Rodar migrations no banco remoto antes de liberar usuários reais.
5. Configurar Mercado Pago somente quando houver credenciais.
6. Configurar um provedor de IA free tier somente no backend.

## Variaveis de ambiente

Obrigatorias:

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=
```

Opcionais:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AI_PROVIDER=gemini
AI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=
OPENROUTER_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

## Checklist antes do deploy

```bash
npm run verify
```

Tambem confira:

```bash
npx prisma migrate status
npm run prisma:validate
```

## Observacao sobre pagamentos

O checkout atual e local/simulado para desenvolvimento. A rota de webhook
`/api/webhooks/mercadopago` já existe e valida assinatura quando
`MERCADOPAGO_WEBHOOK_SECRET` estiver configurado.

## Observacao sobre IA

O provider padrão e `mock`, sem custo. Para usar Gemini, OpenRouter ou outro
provedor, implemente um provider em `src/modules/ai` e mantenha a chave somente
em variavel de ambiente no servidor.
