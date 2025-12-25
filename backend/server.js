const path = require('path');
const envPath = path.join(__dirname, '../.env');
console.log('[DEBUG] Loading .env from:', envPath);
require("dotenv").config({ path: envPath });

console.log('[DEBUG] BLOCKCHAIN_ENABLED =', JSON.stringify(process.env.BLOCKCHAIN_ENABLED));
console.log('[DEBUG] CONTRACT_ADDRESS =', process.env.CONTRACT_ADDRESS);
console.log('[DEBUG] RPC_URL =', process.env.RPC_URL ? 'SET' : 'NOT SET');
console.log('[DEBUG] PRIVATE_KEY =', process.env.PRIVATE_KEY ? 'SET' : 'NOT SET');

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Diploma = require("./models/Diploma");
const Role = require("./models/Role");
const diplomasAPI = require('./api/diplomi');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query,
    ip: req.ip
  });
  next();
});

app.use('/api/diplomas', diplomasAPI);

const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS).toLowerCase();
const STUDENT_SERVICE_ADDRESS = (process.env.STUDENT_SERVICE_ADDRESS).toLowerCase();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await Role.findOneAndUpdate(
      { wallet: ADMIN_ADDRESS },
      { wallet: ADMIN_ADDRESS, role: "ADMIN" },
      { upsert: true }
    );
    await Role.findOneAndUpdate(
      { wallet: STUDENT_SERVICE_ADDRESS },
      { wallet: STUDENT_SERVICE_ADDRESS, role: "STUDENT_SERVICE" },
      { upsert: true }
    );
    console.log("Default roles seeded");
    console.log("Admin address:", ADMIN_ADDRESS);
    console.log("Student Service address:", STUDENT_SERVICE_ADDRESS);
  })
  .catch(err=>console.error(err));

const HARDCODED_ROLES = {
  [ADMIN_ADDRESS]: "ADMIN",
  [STUDENT_SERVICE_ADDRESS]: "STUDENT_SERVICE"
};

console.log("Roles loaded from environment:", HARDCODED_ROLES);

app.get("/api/roles/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const lowerAddress = address.toLowerCase();
    
    console.log("Checking role for:", lowerAddress);
    console.log("Hardcoded match:", HARDCODED_ROLES[lowerAddress]);
    
    if (HARDCODED_ROLES[lowerAddress]) {
      console.log("Returning hardcoded role:", HARDCODED_ROLES[lowerAddress]);
      return res.json({ role: HARDCODED_ROLES[lowerAddress] });
    }

    const roleDoc = await Role.findOne({ wallet: lowerAddress });
    if (!roleDoc) {
      console.log("No role found, returning STUDENT");
      return res.json({ role: "STUDENT" });
    }
    console.log("Returning DB role:", roleDoc.role);
    res.json({ role: roleDoc.role });
  } catch (err) {
    console.error("Role fetch error:", err);
    res.status(500).json({ error: "Failed to fetch role" });
  }
});

app.post("/api/roles/assign", async (req, res) => {
  const { address, role } = req.body;
  console.log(`[ASSIGN ROLE] Assigning role ${role} to address: ${address}`);
  try {
    if (!address || !role) {
      console.log("[ASSIGN ROLE] Error: Address and role are required");
      return res.status(400).json({ error: "Address and role are required" });
    }
    
    const validRoles = ["ADMIN", "STUDENT_SERVICE", "STUDENT"];
    if (!validRoles.includes(role)) {
      console.log(`[ASSIGN ROLE] Error: Invalid role ${role}`);
      return res.status(400).json({ error: "Invalid role" });
    }

    const roleDoc = await Role.findOneAndUpdate(
      { wallet: address.toLowerCase() },
      { wallet: address.toLowerCase(), role },
      { upsert: true, new: true }
    );
    console.log(`[ASSIGN ROLE] Success: Role ${roleDoc.role} assigned to ${address}`);
    res.json({ success: true, role: roleDoc.role });
  } catch (err) {
    console.error("[ASSIGN ROLE] Error:", err);
    res.status(500).json({ error: "Failed to assign role" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
