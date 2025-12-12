# 🚀 AI Document Analyzer - Unified Backend

Production-ready backend combining all features in one place.

## ✨ Features

- ✅ **Gemini 2.0 Flash** AI integration with document-first approach
- ✅ **Document Upload** - PDF, DOCX, PPTX, TXT support
- ✅ **Text Extraction** - Automatic text extraction from all file types
- ✅ **Multi-language** - Support for 8 languages
- ✅ **Chat System** - Context-aware conversations
- ✅ **User Profiles** - Profile management with picture upload
- ✅ **Statistics** - Track user activity and achievements
- ✅ **Chat History** - Save and retrieve conversation history

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already configured with your Gemini API key.

### 3. Start Development Server

```bash
npm run dev
```

Server runs on: `http://localhost:5000`

### 4. Start Frontend

In another terminal:

```bash
cd ../frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Chat
```
POST /api/chat/message
POST /api/chat/clear
```

### Documents
```
POST /api/documents/upload
GET  /api/documents/list
DELETE /api/documents/:id
```

### Profile
```
GET  /api/profile/:userId
PUT  /api/profile/:userId
POST /api/profile/:userId/picture
GET  /api/profile/:userId/settings
PUT  /api/profile/:userId/settings
```

### Stats
```
GET  /api/stats/:userId
POST /api/stats/:userId/increment
GET  /api/stats/:userId/activity
POST /api/stats/:userId/activity
GET  /api/stats/:userId/achievements
POST /api/stats/:userId/achievements/:achievementId
```

### History
```
GET  /api/history/:userId
POST /api/history/:userId
```

## 🔧 Configuration

Edit `.env` file:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_key_here
```

## 📦 Project Structure

```
backend-unified/
├── src/
│   ├── server.js              # Main server
│   ├── routes/                # API routes
│   │   ├── chat.js
│   │   ├── documents.js
│   │   ├── profile.js
│   │   ├── stats.js
│   │   └── history.js
│   └── utils/                 # Utilities
│       ├── gemini.js          # AI integration
│       └── logger.js          # Logging
├── uploads/                   # File storage
├── .env                       # Configuration
├── package.json
└── README.md
```

## 🎯 Features Explained

### Document-First AI Approach

The AI prioritizes information from uploaded documents:

1. **With Documents**: Answers from document content
2. **Partial Match**: Documents + general knowledge
3. **No Documents**: General AI knowledge

### Multi-language Support

Supports 8 languages:
- English
- Hindi
- Telugu
- Tamil
- Malayalam
- Bengali
- Nepali
- Maithili

### File Processing

Automatically extracts text from:
- **PDF**: Using pdf-parse
- **DOCX**: Using mammoth
- **PPTX**: Using unzipper + xml2js
- **TXT**: Direct read

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 📝 Scripts

```bash
npm start        # Production
npm run dev      # Development with nodemon
npm test         # Run tests
npm run lint     # Check code quality
```

## 🔒 Security

- File size limits (50MB max)
- File type validation
- CORS protection
- Request logging
- Error handling

## 🌟 Integration with Frontend

Frontend automatically connects to `http://localhost:5000/api`

All routes are compatible with the existing React frontend.

## 📞 Support

For issues or questions, check the logs in the console.

---

**Status**: ✅ Ready to use - 100% working with frontend
