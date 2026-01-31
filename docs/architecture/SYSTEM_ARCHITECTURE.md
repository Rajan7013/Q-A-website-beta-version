# 🏗️ System Architecture

Overview of the Q&A System's design, components, and data flow.

---

## High-Level Architecture

The system is built on a modern **Microservices-lite** architecture using:
- **Frontend:** React + Vite (Single Page Application)
- **Backend:** Node.js + Express (REST API)
- **Embedding Service:** Python + FastAPI (Vector operations)
- **Database:** Supabase (PostgreSQL + pgvector)
- **Storage:** Cloudflare R2 (Object Storage)
- **Auth:** Clerk (Identity Provider)

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[Frontend (React)]
    
    subgraph "Client Side"
        Frontend -->|Auth| Clerk[Clerk Auth]
    end
    
    subgraph "Server Side"
        Frontend -->|API Requests| Backend[Backend API (Node.js)]
        Backend -->|Auth Verification| Clerk
        Backend -->|Store Files| R2[Cloudflare R2]
        Backend -->|Vector & Metadata| DB[(Supabase DB)]
        Backend -->|Generate Embeddings| Embedding[Embedding Service (Python)]
        Backend -->|Analysis| AI[Gemini / Groq AI]
    end
    
    Embedding -->|Vectors| DB
```

---

## Component Breakdown

### 1. Frontend (`/frontend`)
- **Framework:** React 18 with Vite
- **Styling:** TailwindCSS
- **State Management:** React Context API
- **Routing:** React Router DOM
- **Key Responsibilities:**
  - User Interface & Experience
  - File Upload Handling
  - Chat Interface
  - Real-time feedback
  - Authentication flow (via Clerk SDK)

### 2. Backend API (`/backend-unified`)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Key Responsibilities:**
  - API Gateway for frontend
  - File processing logic (PDF parsing)
  - Orchestrating AI interactions
  - Managing database operations
  - Rate limiting and security

### 3. Embedding Service (`/embedding-service`)
- **Runtime:** Python 3.9+
- **Framework:** FastAPI
- **Key Responsibilities:**
  - Generating text embeddings (using Gemini or HuggingFace models)
  - Semantic search logic
  - Specialized text chunking

### 4. Database (Supabase)
- **Type:** PostgreSQL
- **Key Features:**
  - `pgvector` extension for semantic search
  - Row-Level Security (RLS) for data protection
  - Real-time capabilities

### 5. Storage (Cloudflare R2)
- **Type:** Object Storage (S3 Compatible)
- **Usage:** Stores original PDF/DOCX files securely.
- **Why R2?** Zero egress fees mean we can retrieve files for analysis without cost.

---

## Core Workflows

### 1. Document Upload Flow
1. User uploads PDF in Frontend.
2. Frontend sends file to Backend.
3. Backend uploads original file to **Cloudflare R2**.
4. Backend extracts text from PDF.
5. Backend sends text chunks to **Embedding Service**.
6. Embedding Service generates vectors.
7. Backend stores metadata and vectors in **Supabase**.

### 2. Q&A Chat Flow
1. User asks a question in Frontend.
2. Backend receives question.
3. Backend converts question to vector (via Embedding Service).
4. Backend performs **Similarity Search** in Supabase (finding relevant doc chunks).
5. Backend constructs a prompt: *"Context: [Chunks] Question: [User Query]"*.
6. Backend sends prompt to **Gemini AI**.
7. AI generates answer.
8. Backend streams answer to Frontend.

---

## Technology Decisions

| Component | Choice | Reason |
|-----------|--------|--------|
| **AI Model** | Gemini 2.0 Flash | Best balance of speed, cost (free tier), and context window size. |
| **Vector DB** | Supabase (pgvector) | PostgreSQL is robust, and having vectors next to metadata simplifies queries. |
| **Auth** | Clerk | Easiest implementation with enterprise-grade security features. |
| **Storage** | Cloudflare R2 | Avoids AWS S3 egress fees which can be high for AI analysis. |

---

## Directory Structure

```
root/
├── backend-unified/       # Node.js Express Server
│   ├── routes/            # API Endpoints
│   ├── utils/             # Helper functions (AI, Parsing)
│   └── supabase/          # SQL Schemas
├── frontend/              # React Application
│   ├── src/components/    # UI Components
│   └── src/utils/         # API Clients
├── embedding-service/     # Python Vector Service
└── docs/                  # Documentation
```
