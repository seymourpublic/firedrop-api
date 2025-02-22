require("dotenv").config();
const express = require("express");
const multer = require("multer");
const admin = require("firebase-admin");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const sharp = require("sharp");

// Initialize Firebase
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const app = express();
app.use(cors());
app.use(express.json());

// Multer Configuration - No File Type Restrictions, 50MB Limit
const upload = multer({
    dest: "uploads/", // Save files in the 'uploads' directory instead of temp
    limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  });
  

// Upload single file with optional thumbnail generation
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const filePath = req.file.path;
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(fileName);

    // Upload the file to Firebase Storage
    await fileUpload.save(fs.readFileSync(filePath), {
      metadata: { contentType: req.file.mimetype },
    });

    // Make file publicly accessible
    await fileUpload.makePublic();
    const fileUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;

    let thumbUrl = null;

    // Generate thumbnail ONLY if the file is an image
    if (req.file.mimetype.startsWith("image/")) {
      const thumbName = `thumb-${fileName}`;
      const thumbPath = `uploads/${thumbName}`;

      await sharp(filePath).resize(200, 200).toFile(thumbPath);
      const thumbUpload = bucket.file(`thumbnails/${thumbName}`);
      await thumbUpload.save(fs.readFileSync(thumbPath), {
        metadata: { contentType: req.file.mimetype },
      });

      await thumbUpload.makePublic();
      thumbUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/thumbnails/${thumbName}`;

      // Remove local thumbnail file
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.warn("Warning: Could not delete temp file", error.message);
        }
      }
    }

    // Remove local temp file
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.warn("Warning: Could not delete temp file", err.message);
        });
      }

    res.json({ message: "File uploaded successfully", url: fileUrl, thumbnail: thumbUrl });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// File deletion route
app.delete("/delete/:fileName", async (req, res) => {
  const fileName = req.params.fileName;
  const file = bucket.file(fileName);
  const thumbFile = bucket.file(`thumbnails/thumb-${fileName}`);

  try {
    await file.delete();
    await thumbFile.delete().catch(() => {}); // Ignore errors if no thumbnail exists
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting file", error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 FireDrop API running on port ${PORT}`));
