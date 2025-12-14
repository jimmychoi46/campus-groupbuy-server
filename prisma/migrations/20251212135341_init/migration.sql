-- CreateTable
CREATE TABLE "Listing" (
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
    "negotiable" INTEGER DEFAULT 0,
    "ownerEmail" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
