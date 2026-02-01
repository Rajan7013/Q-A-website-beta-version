# 🧠 DocMind AI - Intelligent Document Analysis Platform

> **Zero-Hallucination | Source-Grounded | Enterprise-Grade RAG System**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Python](https://img.shields.io/badge/Python-3.10-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

### 🚀 **Live Demo:** [https://rajan-docai.vercel.app](https://rajan-docai.vercel.app)

A production-ready Question & Answer system that uses **Retrieval Augmented Generation (RAG)** to provide accurate, citation-backed answers from your documents. Built with security, scalability, and multi-tenancy in mind.

---

## ✨ Key Features

- **📄 Universal Document Support**: PDF, DOCX, PPTX, TXT (up to 100MB)
- **🧠 Advanced RAG Pipeline**:
  - Hybrid Search (Keyword + Semantic)
  - Cross-Encoder Reranking (Cohere/BGE)
  - Page-Aware Chunking & Citation
- **🎙️ Voice Interaction**: Real-time voice input and Text-to-Speech (TTS) response reading.
- **🌍 Multilingual**: Supports 8+ languages with native TTS.
- **🔒 Enterprise Security**:
  - Row Level Security (RLS) via Supabase
  - Private S3 Storage (Cloudflare R2)
  - Role-Based Access Control (Clerk)
- **⚡ High Performance**:
  - Optimistic UI Updates
  - Streaming Responses
  - Efficient Embedding Cache

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+ (for local embedding service)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Rajan7013/Q-A-website.git
cd Q-A-website
```

### 2. Install Dependencies
```bash
# Backend
cd backend-unified
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Setup Environment
Copy the example environment file and fill in your keys:
```bash
cp .env.example backend-unified/.env
cp .env.example frontend/.env
```
> 📖 **[Read the Environment Setup Guide](docs/03-SETUP-GUIDES/environment-setup.md)** for detailed instructions on getting API keys.

### 4. Run Locally
**Terminal 1 (Backend):**
```bash
cd backend-unified
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

**Terminal 3 (Embedding Service):**
```bash
cd embedding-service
pip install -r requirements.txt
python server.py
# Or use Docker: docker-compose up embedding-service
```

Visit `http://localhost:5173` to start!

---

## 📚 Documentation

We have comprehensive documentation to help you understand, deploy, and contribute:

### 🛠️ Setup Guides
- **[Supabase Setup](docs/03-SETUP-GUIDES/supabase-setup.md)** - Database & Auth
- **[Clerk Auth Setup](docs/03-SETUP-GUIDES/clerk-setup.md)** - User Management
- **[Cloudflare R2 Setup](docs/03-SETUP-GUIDES/cloudflare-r2-setup.md)** - Object Storage
- **[Embedding Models](docs/03-SETUP-GUIDES/embedding-service-setup.md)** - Python Service

### ☁️ Deployment
- **[Frontend (Vercel)](docs/04-DEPLOYMENT/vercel-deployment.md)**
- **[Backend (Railway/Render)](docs/04-DEPLOYMENT/backend-deployment.md)**
- **[Embedding Service (Hugging Face)](docs/04-DEPLOYMENT/hugging-face-deployment.md)** 🆕

### 💻 Development
- **[Architecture Overview](docs/02-ARCHITECTURE.md)**
- **[API Reference](docs/05-DEVELOPMENT/api-reference.md)**
- **[Contributing Guidelines](CONTRIBUTING.md)**

---

## 🏗️ Architecture

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[React Frontend (Vite)]
    Frontend -->|Auth| Clerk[Clerk Auth]
    Frontend -->|API| Backend[Node.js Express API]
    Backend -->|Store| R2[Cloudflare R2 (Docs)]
    Backend -->|Vector Search| Supabase[Supabase (pgvector)]
    Backend -->|Generate| LLM[Gemini Pro / Flash]
    Backend -->|Embed/Rerank| Embed[Python Embedding Service]
    Embed -->|Hugging Face| HF[HF Spaces (Docker)]
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to submit pull requests, report issues, and suggest improvements.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔄 System Workflow & User Journey

Here is the complete flow of data from User Interaction to AI Response:

```mermaid
graph TD
    %% Style Definitions
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:white;
    classDef server fill:#10b981,stroke:#047857,color:white;
    classDef storage fill:#f59e0b,stroke:#b45309,color:white;
    classDef ai fill:#8b5cf6,stroke:#5b21b6,color:white;

    %% Client Layers
    User([👤 User])
    Frontend[💻 Frontend UI\n(React + Vite + Voice API)]:::client
    Auth[🔐 Clerk Auth\n(Identity & Access)]:::client

    %% Backend Layers
    Backend[⚙️ Backend API\n(Node.js + Express)]:::server
    EmbedService[🧠 Embedding Service\n(Python Microservice)]:::server

    %% Storage & AI Layers
    R2[(☁️ Cloudflare R2\nFile Storage)]:::storage
    DB[(🗄️ Supabase\nVector DB & Metadata)]:::storage
    Gemini[🤖 Google Gemini\nGenerative AI]:::ai

    %% 1. Authentication Flow
    subgraph Auth_Flow [1. Authentication]
        User -->|Log In| Auth
        Auth -->|Token| Frontend
    end

    %% 2. Upload Flow
    subgraph Upload_Flow [2. Document Processing]
        Frontend -->|Upload File| Backend
        Backend -->|Store PDF| R2
        Backend -->|Request Vector| EmbedService
        EmbedService -->|Return 384-dim Vector| Backend
        Backend -->|Save Vectors + Meta| DB
    end

    %% 3. Q&A Flow
    subgraph QA_Flow [3. Q&A & RAG]
        User -->|Ask Question / Voice| Frontend
        Frontend -->|Send Query| Backend
        Backend -->|Semantic Search| DB
        DB -->|Relevant Chunks| Backend
        Backend -->|Context + Prompt| Gemini
        Gemini -->|AI Answer| Backend
        Backend -->|Stream Response| Frontend
        Frontend -->|Text-to-Speech| User
    end

    %% Connections
    Backend <==> Frontend
```

---

<div align="center">
  <sub>Built with ❤️ by Rajan • Powered by DocMind AI, Gemini, Supabase, & Clerk</sub>
</div>
