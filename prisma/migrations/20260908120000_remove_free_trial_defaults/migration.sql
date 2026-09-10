-- Remove free-trial defaults from subscriptions and existing local data.
UPDATE "Plan"
SET "trialDays" = 0,
    "description" = CASE
      WHEN "key" = 'monthly' THEN 'Acesso premium mensal sem periodo de teste.'
      WHEN "key" = 'annual' THEN 'Acesso premium anual com melhor custo-beneficio.'
      ELSE "description"
    END;

UPDATE "Payment"
SET "status" = 'PAID',
    "paidAt" = COALESCE("paidAt", CURRENT_TIMESTAMP)
WHERE "status" = 'TRIAL';

UPDATE "Subscription"
SET "status" = 'ACTIVE',
    "trialEndsAt" = NULL,
    "currentPeriodStart" = COALESCE("currentPeriodStart", CURRENT_TIMESTAMP),
    "currentPeriodEnd" = COALESCE("currentPeriodEnd", datetime(CURRENT_TIMESTAMP, '+30 days'))
WHERE "status" = 'TRIALING';

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MERCADOPAGO',
    "providerSubscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trialEndsAt" DATETIME,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Subscription" (
    "id",
    "userId",
    "planId",
    "provider",
    "providerSubscriptionId",
    "status",
    "trialEndsAt",
    "currentPeriodStart",
    "currentPeriodEnd",
    "cancelAtPeriodEnd",
    "canceledAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "userId",
    "planId",
    "provider",
    "providerSubscriptionId",
    "status",
    "trialEndsAt",
    "currentPeriodStart",
    "currentPeriodEnd",
    "cancelAtPeriodEnd",
    "canceledAt",
    "createdAt",
    "updatedAt"
FROM "Subscription";

DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";

CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");
CREATE INDEX "Subscription_providerSubscriptionId_idx" ON "Subscription"("providerSubscriptionId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
