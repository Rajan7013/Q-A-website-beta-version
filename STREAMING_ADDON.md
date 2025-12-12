# 🚀 Add Streaming to Your Current System

## ✅ Why This is Better:
- Keep Gemini 2.5 Flash (FREE)
- Keep all recent fixes (page numbers, thresholds, debugging)
- Add real-time streaming like ChatGPT
- Use `fetch` streaming instead of broken EventSource approach

---

## 📝 How to Add Streaming (5 Minutes):

### Step 1: Install Required Package
```bash
cd backend-unified
npm install @google/generative-ai
```

### Step 2: Add Streaming Route
Add this to your `backend-unified/src/routes/query.js`:

```javascript
// Add this AFTER your existing POST route
router.post('/stream', requireAuth, geminiRateLimiter, async (req, res) => {
  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { query, documentIds = [], language = 'en' } = req.body;
    
    // Use ALL your existing code for search/preprocessing
    // ... (copy from current route) ...
    
    // When ready to generate answer:
    sendEvent('status', { message: 'Generating answer...' });
    
    // Use Gemini streaming
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: { temperature: 0.5 }
    });

    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        sendEvent('token', { token: text });
      }
    }
    
    sendEvent('done', { message: 'Complete' });
    res.end();
    
  } catch (error) {
    logger.error('Streaming error', { error: error.message });
    sendEvent('error', { error: error.message });
    res.end();
  }
});
```

### Step 3: Frontend Implementation (React)
```javascript
const streamQuery = async (query) => {
  const response = await fetch('http://localhost:5000/api/query/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, documentIds })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.token) {
          setAnswer(prev => prev + data.token);
        }
      }
    }
  }
};
```

---

## 🎯 Result:
✅ Keep all your fixes
✅ Keep Gemini (FREE)
✅ Add real-time streaming
✅ ChatGPT-like experience

---

## ⚠️ DON'T Use Proposed Code Because:
1. ❌ Switches to OpenAI (costs money)
2. ❌ Removes all our fixes
3. ❌ EventSource implementation is broken
4. ❌ Less robust error handling
