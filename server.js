import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/listings", async (req, res) => {
  const { type, q } = req.query;
  const where = {};
  if (type && (type === "USED" || type === "GROUP")) where.type = type;
  if (q) where.title = { contains: String(q), mode: "insensitive" };

  const items = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });
  res.json(items);
});

app.get("/api/listings/:id", async (req, res) => {
  const item = await prisma.listing.findUnique({ where: { id: req.params.id }, include: { owner: true } });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

app.post("/api/listings", async (req, res) => {
  const { type, title, price, campus, desc, groupTarget, ownerId } = req.body;

  if (!type || !title || typeof price !== "number" || !campus || !desc || !ownerId) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const created = await prisma.listing.create({
   data: {
    type,
    title,
    price: Number(price),
    campus,
    desc,
    ownerId, 
    groupTarget: type === "GROUP" ? Number(groupTarget || 2) : null,
    groupJoined: type === "GROUP" ? 1 : null,
   },
   include: { owner: true }
  });


  res.status(201).json(created);
});

app.post("/api/listings/:id/join", async (req, res) => {
  const id = req.params.id;

  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.listing.findUnique({ where: { id } });
    if (!item) return { status: 404, body: { message: "Not found" } };
    if (item.type !== "GROUP") return { status: 400, body: { message: "Not GROUP" } };
    if (item.status !== "OPEN") return { status: 400, body: { message: "Already closed" } };

    const joined = (item.groupJoined ?? 0) + 1;
    const target = item.groupTarget ?? 0;

    const updated = await tx.listing.update({
      where: { id },
      data: {
        groupJoined: joined,
        status: joined >= target ? "CLOSED" : "OPEN",
      },
      include: { owner: true },
    });

    return { status: 200, body: updated };
  });

  res.status(result.status).json(result.body);
});

app.listen(4000, () => console.log("API running on http://localhost:4000"));
