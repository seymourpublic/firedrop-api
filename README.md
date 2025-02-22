# FireDrop API 🚀🔥

## Overview
FireDrop is a lightweight and scalable file upload API built with **Node.js, Express, and Firebase Storage**. It allows you to **upload, generate thumbnails (for images), and delete files** seamlessly.

## Features
✅ **Upload Any File Type** (Images, PDFs, ZIPs, Videos, etc.)  
✅ **Generate Image Thumbnails** (200x200)  
✅ **Delete Uploaded Files**  
✅ **50MB File Size Limit (Customizable)**  
✅ **Firebase Storage Integration**  
✅ **CORS Enabled for Frontend Integration**  

---

## 🚀 Getting Started

### 1️⃣ Install Dependencies
```sh
npm install
```

### 2️⃣ Set Up Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project and enable **Storage**
3. Download your **Service Account JSON Key** from **Project Settings > Service Accounts**
4. Place it inside your project folder as `serviceAccountKey.json`

### 3️⃣ Create a `.env` File
```
FIREBASE_STORAGE_BUCKET=your-firebase-bucket-name.appspot.com
PORT=5000
```
Replace `your-firebase-bucket-name.appspot.com` with your Firebase Storage bucket name.

### 4️⃣ Start the Server
```sh
node server.js
```

---

## API Endpoints

### 🔹 Upload a File
**POST** `/upload`
```sh
curl -X POST -F "file=@path/to/file.jpg" http://localhost:5000/upload
```
**Response:**
```json
{
  "message": "File uploaded successfully",
  "url": "https://storage.googleapis.com/your-bucket/1708629812345-image.jpg",
  "thumbnail": "https://storage.googleapis.com/your-bucket/thumbnails/thumb-1708629812345-image.jpg"
}
```

### 🔹 Delete a File
**DELETE** `/delete/:fileName`
```sh
curl -X DELETE http://localhost:5000/delete/1708629812345-file.jpg
```
**Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## 🔧 Configuration & Customization

### ✅ Change File Size Limit
Modify this in `server.js`:
```javascript
limits: { fileSize: 100 * 1024 * 1024 } // Set to 100MB
```

### ✅ Secure File Access (Make Files Private)
Instead of `makePublic()`, generate a **signed URL** with expiration:
```javascript
const [url] = await fileUpload.getSignedUrl({
  action: "read",
  expires: Date.now() + 60 * 60 * 1000, // 1 hour expiration
});
```

---

## 📜 License
MIT License

---

## 👨‍💻 Contributing
Feel free to **fork and improve** FireDrop! Submit a PR or open an issue if you have suggestions. 🚀