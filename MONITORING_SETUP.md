# 📊 Production Monitoring Setup

## Why Monitor?
- Detect issues before users complain
- Track performance metrics
- Plan for scaling
- Debug production errors

---

## 🎯 Essential Monitoring (Free Tier)

### 1. **Uptime Monitoring - UptimeRobot** (Free)

**Setup (5 min):**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create account (free)
3. Add monitors:
   - **Backend Health:** `https://your-backend.onrender.com/health`
   - **Frontend:** `https://your-app.vercel.app`
4. Set alert email
5. Enable status page (optional)

**What it monitors:**
- ✅ Service availability (every 5 min)
- ✅ Response time
- ✅ SSL certificate expiry
- ✅ Email alerts on downtime

---

### 2. **Error Tracking - Sentry** (Free Tier)

**Backend Setup:**

```bash
cd backend-unified
npm install @sentry/node @sentry/profiling-node
```

```javascript
// backend-unified/src/server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// The request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// All your routes here...

// The error handler must be registered before any other error middleware
app.use(Sentry.Handlers.errorHandler());
```

**Frontend Setup:**

```bash
cd frontend
npm install @sentry/react
```

```javascript
// frontend/src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**What it tracks:**
- ✅ JavaScript errors
- ✅ API failures
- ✅ Performance issues
- ✅ User sessions (replay)
- ✅ Stack traces

---

### 3. **Analytics - Vercel Analytics** (Free)

**Setup (1 min):**
1. Vercel Dashboard → Your Project
2. Click "Analytics" tab
3. Enable Web Analytics
4. Add to frontend:

```bash
npm install @vercel/analytics
```

```javascript
// frontend/src/main.jsx
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
  </>
);
```

**What it tracks:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Real User Monitoring (Core Web Vitals)

---

### 4. **Database Monitoring - Supabase** (Included)

**Setup:** Already enabled!

**Check:**
1. Supabase Dashboard
2. Go to "Database" → "Logs"
3. Monitor:
   - Query performance
   - Storage usage
   - Connection pool
   - RLS policy violations

---

### 5. **Backend Logs - Render** (Included)

**Access:**
- Render Dashboard → Your Service → Logs
- Real-time log streaming
- Filter by level (info, warn, error)

**Useful for:**
- API request logs
- Error traces
- Performance metrics

---

## 📈 Advanced Monitoring (Optional)

### 6. **APM - New Relic** (Free Tier)

```bash
npm install newrelic
```

Monitors:
- Transaction traces
- Database queries
- External service calls
- Memory/CPU usage

---

### 7. **LogDNA / BetterStack** (Free Tier)

Centralized logging:
- Aggregate all logs
- Search & filter
- Create dashboards
- Set up alerts

---

## 🔔 Alert Setup

### Critical Alerts (Immediate):
- ❌ Service down
- ❌ Database connection failed
- ❌ Storage quota exceeded
- ❌ Rate limit constantly hit

### Warning Alerts (24hr):
- ⚠️ High error rate (>1%)
- ⚠️ Slow response time (>3s)
- ⚠️ High CPU usage (>80%)
- ⚠️ Storage 80% full

---

## 📊 Key Metrics to Track

### Performance:
- **Response Time:** < 2 seconds
- **Uptime:** > 99.5%
- **Error Rate:** < 1%
- **API Success Rate:** > 99%

### Business:
- Daily Active Users
- Documents Uploaded
- AI Queries
- User Retention

### Technical:
- Memory Usage
- CPU Usage
- Database Connections
- Storage Usage

---

## 🎯 Monitoring Dashboard

Create a simple dashboard with:
1. **Uptime:** UptimeRobot status page
2. **Errors:** Sentry dashboard
3. **Analytics:** Vercel Analytics
4. **Logs:** Render logs

---

## 📞 Incident Response

### When Alert Fires:

1. **Check Status:**
   - UptimeRobot: Is service down?
   - Sentry: What's the error?
   - Logs: What happened?

2. **Quick Fixes:**
   - Restart service (Render dashboard)
   - Rollback deployment (if recent)
   - Check environment variables

3. **Investigate:**
   - Review logs
   - Check database
   - Verify external services (R2, Clerk)

4. **Communicate:**
   - Update status page
   - Notify users (if needed)
   - Document incident

---

## ✅ Monitoring Checklist

- [ ] UptimeRobot configured
- [ ] Email alerts set up
- [ ] Sentry installed (backend)
- [ ] Sentry installed (frontend)
- [ ] Vercel Analytics enabled
- [ ] Logs reviewed daily
- [ ] Performance baselines set
- [ ] Alert thresholds configured
- [ ] Incident response plan documented

---

## 🔍 Quick Health Check

Run this daily:

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Frontend load time
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app

# Database check
# Supabase Dashboard → Health
```

---

**Monitoring = Peace of Mind** ✅
