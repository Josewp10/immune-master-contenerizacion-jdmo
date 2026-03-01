import random
import time
import logging
import os
from fastapi import FastAPI, HTTPException
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel

# Logging estructurado
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "service": "quotes-service", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

# OpenTelemetry - Jaeger
jaeger_host = os.getenv("JAEGER_HOST", "jaeger-collector.observability.svc.cluster.local")
jaeger_port = int(os.getenv("JAEGER_PORT", "6831"))

provider = TracerProvider()
jaeger_exporter = JaegerExporter(
    agent_host_name=jaeger_host,
    agent_port=jaeger_port,
)
provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

app = FastAPI(title="Quotes Service", version="1.0.0")

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

QUOTES = [
    {"id": 1, "text": "The best way to predict the future is to invent it.", "author": "Alan Kay"},
    {"id": 2, "text": "Any sufficiently advanced technology is indistinguishable from magic.", "author": "Arthur C. Clarke"},
    {"id": 3, "text": "Talk is cheap. Show me the code.", "author": "Linus Torvalds"},
    {"id": 4, "text": "First, solve the problem. Then, write the code.", "author": "John Johnson"},
    {"id": 5, "text": "Simplicity is the soul of efficiency.", "author": "Austin Freeman"},
    {"id": 6, "text": "Make it work, make it right, make it fast.", "author": "Kent Beck"},
    {"id": 7, "text": "Code is like humor. When you have to explain it, it's bad.", "author": "Cory House"},
    {"id": 8, "text": "Experience is the name everyone gives to their mistakes.", "author": "Oscar Wilde"},
]

# Simulated failure flag
FAIL_RATE = float(os.getenv("FAIL_RATE", "0"))

class Quote(BaseModel):
    id: int
    text: str
    author: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "quotes-service"}

@app.get("/quotes", response_model=list[Quote])
def get_all_quotes():
    with tracer.start_as_current_span("get-all-quotes"):
        logger.info("Fetching all quotes")
        if random.random() < FAIL_RATE:
            logger.error("Simulated failure triggered!")
            raise HTTPException(status_code=500, detail="Simulated failure")
        time.sleep(random.uniform(0.01, 0.05))  # simulate latency
        return QUOTES

@app.get("/quotes/random", response_model=Quote)
def get_random_quote():
    with tracer.start_as_current_span("get-random-quote") as span:
        logger.info("Fetching random quote")
        if random.random() < FAIL_RATE:
            logger.error("Simulated failure triggered!")
            raise HTTPException(status_code=500, detail="Simulated failure")
        quote = random.choice(QUOTES)
        span.set_attribute("quote.id", quote["id"])
        span.set_attribute("quote.author", quote["author"])
        time.sleep(random.uniform(0.01, 0.08))
        return quote

@app.get("/quotes/{quote_id}", response_model=Quote)
def get_quote(quote_id: int):
    with tracer.start_as_current_span("get-quote-by-id") as span:
        span.set_attribute("quote.id", quote_id)
        logger.info(f"Fetching quote id={quote_id}")
        quote = next((q for q in QUOTES if q["id"] == quote_id), None)
        if not quote:
            logger.warning(f"Quote {quote_id} not found")
            raise HTTPException(status_code=404, detail="Quote not found")
        return quote