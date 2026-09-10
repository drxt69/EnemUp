import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import Database from "better-sqlite3";

const databasePath = "prisma/dev.db";
const migrations = [
  {
    name: "20260827111500_init_platform_schema",
    requiredTable: "User",
  },
  {
    name: "20260827133000_add_enem_import_queue",
    requiredTable: "EnemImportSource",
  },
  {
    name: "20260908120000_remove_free_trial_defaults",
    requiredTable: "Subscription",
    runWhenUnapplied: true,
  },
];

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function hasTable(tableName) {
  if (!existsSync(databasePath)) {
    return false;
  }

  const db = new Database(databasePath, { readonly: true });
  try {
    const row = db
      .prepare("select name from sqlite_master where type = 'table' and name = ?")
      .get(tableName);

    return Boolean(row);
  } finally {
    db.close();
  }
}

function hasAppliedMigration(migrationName) {
  if (!hasTable("_prisma_migrations")) {
    return false;
  }

  const db = new Database(databasePath, { readonly: true });
  try {
    const row = db
      .prepare('select migration_name from "_prisma_migrations" where migration_name = ?')
      .get(migrationName);

    return Boolean(row);
  } finally {
    db.close();
  }
}

run("npx prisma generate");

for (const migration of migrations) {
  const migrationPath = `prisma/migrations/${migration.name}/migration.sql`;
  const isApplied = hasAppliedMigration(migration.name);

  if (!isApplied && (migration.runWhenUnapplied || !hasTable(migration.requiredTable))) {
    run(`npx prisma db execute --file ${migrationPath}`);
  }

  if (!isApplied) {
    run(`npx prisma migrate resolve --applied ${migration.name}`);
  }
}

run("npx prisma db seed");

console.log("Database setup finished.");
