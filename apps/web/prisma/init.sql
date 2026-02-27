PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT,
  "displayName" TEXT NOT NULL,
  "preferredLocales" TEXT NOT NULL DEFAULT 'en,de',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Household" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "defaultLocale" TEXT NOT NULL DEFAULT 'de',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "HouseholdMembership" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseholdMembership_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HouseholdMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "HouseholdMembership_householdId_userId_key"
  ON "HouseholdMembership"("householdId", "userId");
CREATE INDEX IF NOT EXISTS "HouseholdMembership_userId_idx"
  ON "HouseholdMembership"("userId");

CREATE TABLE IF NOT EXISTS "PantryItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "addedByUserId" TEXT NOT NULL,
  "primaryName" TEXT NOT NULL,
  "normalizedPrimaryName" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "quantity" REAL NOT NULL,
  "unit" TEXT,
  "category" TEXT NOT NULL DEFAULT 'OTHER',
  "location" TEXT,
  "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "useByDate" DATETIME,
  "shelfLifeDays" INTEGER,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PantryItem_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PantryItem_addedByUserId_fkey"
    FOREIGN KEY ("addedByUserId") REFERENCES "User" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PantryItem_householdId_useByDate_idx"
  ON "PantryItem"("householdId", "useByDate");
CREATE INDEX IF NOT EXISTS "PantryItem_canonicalName_idx"
  ON "PantryItem"("canonicalName");

CREATE TABLE IF NOT EXISTS "PantryItemName" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PantryItemName_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "PantryItem" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PantryItemName_normalizedText_idx"
  ON "PantryItemName"("normalizedText");
CREATE UNIQUE INDEX IF NOT EXISTS "PantryItemName_itemId_normalizedText_key"
  ON "PantryItemName"("itemId", "normalizedText");
