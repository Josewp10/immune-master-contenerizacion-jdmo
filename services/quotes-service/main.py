import random
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Logging estructurado
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "service": "quotes-service", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Quotes Service", version="1.0.0")

# Quotes data
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

class Quote(BaseModel):
    id: int
    text: str
    author: str

# Routes
@app.get("/health")
def health():
    return {"status": "ok", "service": "quotes-service"}

@app.get("/error")
def error():
    """Always returns a 500 error for testing purposes"""
    raise HTTPException(status_code=500, detail="Failed request")
    
@app.get("/quotes", response_model=list[Quote])
def get_all_quotes():
    logger.info("Fetching all quotes")
    return QUOTES

@app.get("/quotes/random", response_model=Quote)
def get_random_quote():
    quote = random.choice(QUOTES)
    logger.info(f"Fetching random quote id={quote['id']}")
    return quote

@app.get("/quotes/{quote_id}", response_model=Quote)
def get_quote(quote_id: int):
    logger.info(f"Fetching quote id={quote_id}")
    quote = next((q for q in QUOTES if q["id"] == quote_id), None)
    if not quote:
        logger.warning(f"Quote {quote_id} not found")
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote