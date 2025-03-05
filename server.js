require("dotenv").config();
const express = require("express");
const multer = require("multer");
const admin = require("firebase-admin");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const sharp = require("sharp");


const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const app = express();
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow common HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Allow these headers
  };

app.use(cors(corsOptions));
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
      const metadata = {
        contentType: req.file.mimetype,  // Ensure Firebase recognizes the file type
        };
      await fileUpload.save(fs.readFileSync(filePath), { metadata });

      // Get public URL
      const [fileUrl] = await fileUpload.getSignedUrl({
          action: "read",
          expires: "03-09-2030", // Set expiration far in the future
      });

      let thumbUrl = null;

      // Generate thumbnail ONLY if the file is an image
     /* if (req.file.mimetype.startsWith("image/")) {
          const thumbName = `thumbnails/thumb-${fileName}`;
          const thumbPath = `uploads/${thumbName}`;

          await sharp(filePath).resize(200, 200).toFile(thumbPath);
          const thumbUpload = bucket.file(thumbName);
          await thumbUpload.save(fs.readFileSync(thumbPath), {
              metadata: { contentType: req.file.mimetype },
          });

          // Get public URL for thumbnail
          const [thumbSignedUrl] = await thumbUpload.getSignedUrl({
              action: "read",
              expires: "03-09-2030",
          });
          thumbUrl = thumbSignedUrl;

          // Remove local thumbnail file
          if (fs.existsSync(thumbPath)) {
              try {
                  fs.unlinkSync(thumbPath);
              } catch (error) {
                  console.warn("Warning: Could not delete temp thumbnail", error.message);
              }
          }
      }*/

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
