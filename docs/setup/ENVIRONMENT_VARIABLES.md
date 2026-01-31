# 🌐 Environment Variables Reference

Complete guide to all `.env` variables used in the Q&A System.

---

## Backend `.env`
**Location:** `backend-unified/.env`

### Core Server Config
| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Application URL (for CORS) | `http://localhost:5173` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Database (Supabase)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL from Supabase Settings |
| `SUPABASE_SERVICE_KEY` | **SECRET** Service Role Key (Database Admin) |
| `SUPABASE_ANON_KEY` | Public Anon Key (Optional for backend) |

### Authentication (Clerk)
| Variable | Description |
|----------|-------------|
| `CLERK_SECRET_KEY` | **SECRET** Backend API Key |
| `CLERK_PUBLISHABLE_KEY` | Public Key (Shared with Frontend) |

### Storage (Cloudflare R2)
| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare Account ID (Hex string) |
| `R2_ACCESS_KEY_ID` | R2 API Token Key ID |
| `R2_SECRET_ACCESS_KEY` | **SECRET** R2 API Token Secret |
| `R2_BUCKET_NAME` | Name of the bucket (e.g., `ai-doc-analyzer`) |
| `R2_PUBLIC_URL` | Public access URL (e.g., `https://pub-xxx.r2.dev`) |

### AI Services
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API Key |
| `GROQ_API_KEY` | Groq API Key (Optional) |
| `COHERE_API_KEY` | Cohere Rerank API Key (Optional) |
| `USE_PRO_MODEL` | `true` or `false` (Toggle between Flash/Pro) |
| `EMBEDDING_SERVICE_URL` | URL of Python embedding service | `http://localhost:8001` |

### Limits & Config
| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE_MB` | Max upload size | `50` |
| `ALLOWED_FILE_TYPES` | Comma-separated extensions | `pdf,docx,txt` |

---

## Frontend `.env`
**Location:** `frontend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY`| Clerk Public Key | `pk_test_...` |
| `VITE_API_URL` | Backend API Base URL | `http://localhost:5000/api` |

---

## Embedding Service `.env` (Python)
**Location:** `embedding-service/.env` (If applicable)

| Variable | Description |
|----------|-------------|
| `PORT` | Service port |
| `GEMINI_API_KEY` | Needs Gemini key for embeddings |

---

## 📝 Example `.env` File

Copy this to `backend-unified/.env`:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# AI
GEMINI_API_KEY=AIzaSy...
USE_PRO_MODEL=false

# Auth
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Database
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Storage
R2_ACCOUNT_ID=56f...
R2_ACCESS_KEY_ID=164...
R2_SECRET_ACCESS_KEY=823...
R2_BUCKET_NAME=qa-system
R2_PUBLIC_URL=https://pub-xyz.r2.dev

# Internal Services
EMBEDDING_SERVICE_URL=http://localhost:8001
```
