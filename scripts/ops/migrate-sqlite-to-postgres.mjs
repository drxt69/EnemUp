import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const sqlitePath = process.env.SQLITE_DATABASE_PATH
  ? path.resolve(projectRoot, process.env.SQLITE_DATABASE_PATH)
  : path.join(projectRoot, "prisma", "dev.db");
const databaseUrl = process.env.DATABASE_URL;

const tables = [
  "User",
  "Profile",
  "Role",
  "Permission",
  "UserRole",
  "RolePermission",
  "Account",
  "Session",
  "VerificationToken",
  "PasswordResetToken",
  "Plan",
  "Subscription",
  "Payment",
  "Coupon",
  "ExamYear",
  "Area",
  "Subject",
  "Topic",
  "Exam",
  "EnemImportSource",
  "QuestionImportDraft",
  "Question",
  "Alternative",
  "QuestionTopic",
  "Simulation",
  "SimulationQuestion",
  "SimulationRun",
  "StudentAnswer",
  "Result",
  "EssayTheme",
  "EssaySubmission",
  "EssayCorrection",
  "EssayCompetency",
  "EssayCompetencyScore",
  "StudyPlan",
  "StudySchedule",
  "StudyTask",
  "ProgressRecord",
  "Material",
  "PdfMaterial",
  "AIConversation",
  "AIMessage",
  "Notification",
  "AdminLog",
];

const booleanColumnsByTable = new Map([
  ["Plan", new Set(["isActive"])],
  ["Subscription", new Set(["cancelAtPeriodEnd"])],
  ["Coupon", new Set(["isActive"])],
  ["Simulation", new Set(["isPublished"])],
  ["Question", new Set(["isPublished"])],
  ["Alternative", new Set(["isCorrect"])],
  ["StudentAnswer", new Set(["isCorrect"])],
  ["EssayTheme", new Set(["isPublished"])],
  ["Material", new Set(["isPublished"])],
]);

if (!databaseUrl?.startsWith("postgresql://") && !databaseUrl?.startsWith("postgres://")) {
  console.error("DATABASE_URL precisa ser uma URL PostgreSQL online.");
  process.exit(1);
}

if (process.env.CONFIRM_IMPORT !== "yes") {
  console.error("Para copiar os dados, rode com CONFIRM_IMPORT=yes.");
  console.error("Atenção: o banco PostgreSQL de destino será limpo antes da importação.");
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function normalizeValue(table, column, value) {
  if (value === undefined) return null;

  const booleanColumns = booleanColumnsByTable.get(table);
  if (booleanColumns?.has(column)) {
    return value === true || value === 1 || value === "1";
  }

  return value;
}

try {
  console.log(`Lendo SQLite: ${sqlitePath}`);
  await client.query("BEGIN");
  await client.query(
    `TRUNCATE ${tables.map(quoteIdentifier).join(", ")} RESTART IDENTITY CASCADE`,
  );

  for (const table of tables) {
    const columns = sqlite
      .prepare(`PRAGMA table_info(${quoteIdentifier(table)})`)
      .all()
      .map((column) => column.name);

    if (columns.length === 0) {
      console.log(`Tabela ignorada, não existe no SQLite: ${table}`);
      continue;
    }

    const rows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(table)}`).all();
    if (rows.length === 0) {
      console.log(`${table}: 0 registros`);
      continue;
    }

    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const sql = `INSERT INTO ${quoteIdentifier(table)} (${columns
      .map(quoteIdentifier)
      .join(", ")}) VALUES (${placeholders})`;

    for (const row of rows) {
      const values = columns.map((column) => normalizeValue(table, column, row[column]));
      await client.query(sql, values);
    }

    console.log(`${table}: ${rows.length} registros importados`);
  }

  await client.query("COMMIT");
  console.log("Importação concluída com sucesso.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Importação cancelada. Nenhuma alteração foi mantida no PostgreSQL.");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
  sqlite.close();
}
