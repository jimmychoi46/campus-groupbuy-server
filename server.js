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
  });
  res.json(items);
});

app.get("/api/listings/:id", async (req, res) => {
  const item = await prisma.listing.findUnique({ where: { id: req.params.id }});
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

app.post("/api/listings", async (req, res) => {
  const { type, title, price, campus, desc, groupTarget, ownerEmail, ownerName, deadline, negotiable} = req.body;

  if (!type || !title || typeof price !== "number" || !campus || !desc || !ownerEmail) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // deadline 체크
  
  let verifiedDeadline = null;
  if (deadline) {
    const dead = new Date(deadline);
    if (isNaN(dead.getTime())) {
      return res.status(400).json({ message: "Invalid deadline"});
    }
    verifiedDeadline = dead;
  }
  const created = await prisma.listing.create({
   data: {
    type,
    title,
    price: Number(price),
    campus,
    desc,
    ownerEmail,
    ownerName: ownerName || "학생",
    groupTarget: type === "GROUP" ? Number(groupTarget || 2) : null,
    groupJoined: type === "GROUP" ? 1 : null,
    deadline: verifiedDeadline,
    negotiable: negotiable ?? false
   },
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
  });

    return { status: 200, body: updated };
  });

  res.status(result.status).json(result.body);
});
 
// 토글 라우트
    
app.post("/api/listings/:id/toggle", async (req, res) => {
  const id = req.params.id; 
  
  try { 
    const item = await prisma.listing.findUnique({ where: { id } }); 
    if (!item) return res.status(404).json({ message: "Not found" }); 

    // 작성자 및 운영자만 접근 가능
    if (item.ownerEmail !== userEmail && userRole !== "ADMIN") {
      return res.status(403).json({ message: "Not allowed" }); 
    }
    
    const newStatus = item.status === "OPEN" ? "CLOSED" : "OPEN"; 
    
    const updated = await prisma.listing.update({
      where: { id },
      data: { status: newStatus } 
    }); 
    
    res.json(updated); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" }); 
  } 
});

// 삭제 라우트
app.delete("/api/listings/:id", async (req, res) => {
  const id = req.params.id;
  const userEmail = req.headers["x-user-email"];
  
  try { 
    const item = await prisma.listing.findUnique({ where: { id } }); 
    if (!item) return res.status(404).json({ message: "Not found" }); 

    // 작성자 및 운영자만 접근 가능
    if (item.ownerEmail !== userEmail && userRole !== "ADMIN") { 
      return res.status(403).json({ message: "Not allowed" }); 
    } 
    
    await prisma.listing.delete({ where: { id } }); 
    res.json({ ok: true }); 
  } catch (err) {
    res.status(500).json({ message: "Server error" }); 
  } 
});

app.listen(4000, () => console.log("API running on http://localhost:4000"));
