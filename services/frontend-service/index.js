const express = require('express');
const axios = require('axios');
const { NodeTracerProvider } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { trace, context, propagation } = require('@opentelemetry/api');
const { W3CTraceContextPropagator } = require('@opentelemetry/core');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const promClient = require('prom-client');

// ─── OpenTelemetry Setup ───────────────────────────────────────────────────
const jaegerHost = process.env.JAEGER_HOST || 'jaeger-collector.observability.svc.cluster.local';
const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  host: jaegerHost,
  port: 6832,
});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register({ propagator: new W3CTraceContextPropagator() });

registerInstrumentations({
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

const tracer = trace.getTracer('frontend-service');

// ─── Prometheus Setup ──────────────────────────────────────────────────────
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'frontend_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

// ─── App ───────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const QUOTES_SERVICE_URL = process.env.QUOTES_SERVICE_URL || 'http://quotes-service:8000';

// Structured logging
const log = (level, message, extra = {}) => {
  console.log(JSON.stringify({ time: new Date().toISOString(), level, service: 'frontend-service', message, ...extra }));
};

// Middleware: request duration metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, status_code: res.statusCode });
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'frontend-service' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', async (req, res) => {
  const span = tracer.startSpan('render-home');
  try {
    log('info', 'Rendering home page');
    const response = await axios.get(`${QUOTES_SERVICE_URL}/quotes/random`, { timeout: 3000 });
    const quote = response.data;
    span.setAttribute('quote.id', quote.id);

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuotesMesh — Cloud Native Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 2.5rem; max-width: 640px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.4); }
    .badge { display: inline-block; background: #6366f1; color: white; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 99px; margin-bottom: 1.5rem; letter-spacing: 0.05em; text-transform: uppercase; }
    blockquote { font-size: 1.4rem; font-style: italic; color: #f1f5f9; line-height: 1.6; margin-bottom: 1rem; }
    .author { color: #94a3b8; font-size: 0.95rem; margin-bottom: 2rem; }
    .author::before { content: "— "; }
    .btn { display: inline-block; background: #6366f1; color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; cursor: pointer; border: none; font-size: 1rem; }
    .btn:hover { background: #4f46e5; }
    .links { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .link { color: #64748b; font-size: 0.85rem; text-decoration: none; padding: 0.4rem 0.8rem; border: 1px solid #334155; border-radius: 6px; }
    .link:hover { color: #94a3b8; border-color: #475569; }
    .meta { margin-top: 1.5rem; font-size: 0.75rem; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">☁️ Cloud Native Demo</span>
    <blockquote>"${quote.text}"</blockquote>
    <p class="author">${quote.author}</p>
    <button class="btn" onclick="location.reload()">New Quote</button>
    <div class="links">
      <a class="link" href="/quotes">All Quotes (JSON)</a>
      <a class="link" href="http://localhost:3000/grafana" target="_blank">📊 Grafana</a>
      <a class="link" href="http://localhost:3000/jaeger" target="_blank">🔍 Jaeger</a>
      <a class="link" href="http://localhost:3000/kiali" target="_blank">🕸️ Kiali</a>
    </div>
    <p class="meta">Quote ID: ${quote.id} | Served by: frontend-service | Backend: quotes-service</p>
  </div>
</body>
</html>`);
  } catch (err) {
    log('error', 'Failed to fetch quote', { error: err.message });
    span.recordException(err);
    res.status(502).send(`<h1 style="font-family:sans-serif;color:#ef4444;padding:2rem">⚠️ Backend unavailable: ${err.message}</h1>`);
  } finally {
    span.end();
  }
});

app.get('/quotes', async (req, res) => {
  const span = tracer.startSpan('proxy-get-all-quotes');
  try {
    log('info', 'Proxying /quotes request');
    const response = await axios.get(`${QUOTES_SERVICE_URL}/quotes`, { timeout: 3000 });
    res.json(response.data);
  } catch (err) {
    log('error', 'Failed to proxy quotes', { error: err.message });
    span.recordException(err);
    res.status(502).json({ error: 'Backend unavailable', detail: err.message });
  } finally {
    span.end();
  }
});

app.listen(PORT, () => {
  log('info', `Frontend service listening on port ${PORT}`);
});