const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu backend FastAPI
// En Docker: http://quotes-service:8000
// En local:  http://localhost:8000
const QUOTES_SERVICE_URL = process.env.QUOTES_SERVICE_URL || 'http://localhost:8000';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'frontend-service' });
});

app.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${QUOTES_SERVICE_URL}/quotes/random`);
    const quote = response.data;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotes App</title>
        <style>
          body {
            font-family: Arial;
            background: #111;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .card {
            background: #222;
            padding: 40px;
            border-radius: 12px;
            max-width: 600px;
            text-align: center;
          }
          button {
            margin-top: 20px;
            padding: 10px 20px;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Random Quote</h2>
          <p>"${quote.text}"</p>
          <p><strong>— ${quote.author}</strong></p>
          <button onclick="location.reload()">New Quote</button>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(502).send(`
      <h1 style="color:red">Backend unavailable</h1>
      <p>${err.message}</p>
    `);
  }
});

app.get('/quotes', async (req, res) => {
  try {
    const response = await axios.get(`${QUOTES_SERVICE_URL}/quotes`);
    res.json(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Backend unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});