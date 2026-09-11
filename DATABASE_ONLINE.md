# Banco online do ENEM UP

O projeto foi preparado para usar PostgreSQL online em produção.

## Variável necessária

Na Vercel, configure:

```text
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:PORTA/BANCO?schema=public
```

Use a URL de conexão do provedor escolhido, por exemplo Neon, Supabase, Prisma Postgres ou Vercel Postgres.

## Depois de cadastrar a DATABASE_URL

Rode localmente, usando a mesma URL do banco online no `.env`:

```powershell
npx prisma migrate deploy
npm run prisma:seed
```

Depois faça redeploy na Vercel.

## Copiar os dados do SQLite local

Depois que o banco online estiver criado e migrado, copie os dados atuais com:

```powershell
$env:CONFIRM_IMPORT="yes"
npm run db:import:postgres
```

Esse comando usa `prisma/dev.db` como origem e a `DATABASE_URL` PostgreSQL como destino.
Ele limpa o banco online antes de importar, então use apenas no banco novo/vazio.

## Importante

O valor antigo abaixo era apenas SQLite local e nao deve ser usado na Vercel:

```text
file:./prisma/dev.db
```

O arquivo local `prisma/dev.db` foi preservado como backup dos dados antigos.

As migrations SQLite antigas foram preservadas em:

```text
prisma/migrations_sqlite_backup
```
