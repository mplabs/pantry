PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" DATETIME,
  "image" TEXT,
  "preferredLocales" TEXT NOT NULL DEFAULT 'en,de',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key"
  ON "VerificationToken"("identifier", "token");

CREATE TABLE IF NOT EXISTS "Authenticator" (
  "credentialID" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "credentialPublicKey" TEXT NOT NULL,
  "counter" INTEGER NOT NULL,
  "credentialDeviceType" TEXT NOT NULL,
  "credentialBackedUp" BOOLEAN NOT NULL,
  "transports" TEXT,
  PRIMARY KEY ("userId", "credentialID"),
  CONSTRAINT "Authenticator_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Authenticator_credentialID_key"
  ON "Authenticator"("credentialID");

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
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HouseholdMembership_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "HouseholdMembership_householdId_userId_key"
  ON "HouseholdMembership"("householdId", "userId");
CREATE INDEX IF NOT EXISTS "HouseholdMembership_userId_idx"
  ON "HouseholdMembership"("userId");

CREATE TABLE IF NOT EXISTS "HouseholdInvite" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "householdId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "expiresAt" DATETIME NOT NULL,
  "acceptedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HouseholdInvite_householdId_fkey"
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HouseholdInvite_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "HouseholdInvite_acceptedByUserId_fkey"
    FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "HouseholdInvite_token_key" ON "HouseholdInvite"("token");
CREATE INDEX IF NOT EXISTS "HouseholdInvite_householdId_expiresAt_idx"
  ON "HouseholdInvite"("householdId", "expiresAt");

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
    FOREIGN KEY ("householdId") REFERENCES "Household"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PantryItem_addedByUserId_fkey"
    FOREIGN KEY ("addedByUserId") REFERENCES "User"("id")
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
    FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "PantryItemName_normalizedText_idx"
  ON "PantryItemName"("normalizedText");
CREATE UNIQUE INDEX IF NOT EXISTS "PantryItemName_itemId_normalizedText_key"
  ON "PantryItemName"("itemId", "normalizedText");
