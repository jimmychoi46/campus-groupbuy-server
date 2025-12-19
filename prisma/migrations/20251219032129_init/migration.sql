/*
  Warnings:

  - You are about to drop the column `ownerEmail` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `Listing` table. All the data in the column will be lost.
  - You are about to alter the column `negotiable` on the `Listing` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - Added the required column `ownerId` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "campus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "groupTarget" INTEGER,
    "groupJoined" INTEGER,
    "deadline" DATETIME,
    "desc" TEXT NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("campus", "createdAt", "deadline", "desc", "groupJoined", "groupTarget", "id", "negotiable", "price", "status", "title", "type", "updatedAt") SELECT "campus", "createdAt", "deadline", "desc", "groupJoined", "groupTarget", "id", coalesce("negotiable", false) AS "negotiable", "price", "status", "title", "type", "updatedAt" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");
