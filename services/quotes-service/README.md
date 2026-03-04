# Quotes Service

## Overview

The Quotes Service is a Python-based microservice built with FastAPI that provides a RESTful API for managing and retrieving inspirational quotes. It serves as the backend for the QuotesMesh demo application, offering endpoints to fetch all quotes, random quotes, and specific quotes by ID. The service includes comprehensive observability features with OpenTelemetry tracing and Prometheus metrics.

## Features

- **RESTful API**: Provides endpoints for retrieving quotes with proper HTTP status codes and JSON responses.
- **Random Quote Generation**: Returns a random quote from the predefined collection.
- **Quote Retrieval by ID**: Allows fetching specific quotes using their unique identifier.
- **Health Check**: Includes a `/health` endpoint for service monitoring.
- **Observability**: Integrated with OpenTelemetry for distributed tracing using Jaeger and Prometheus for metrics collection.
- **Simulated Failures**: Configurable failure rate for testing resilience and observability.
- **Containerized**: Multi-stage Dockerfile for efficient container builds.
- **Security**: Runs as a non-root user in the container.

## Prerequisites

- Python 3.12 or later
- Docker (for containerized deployment)
- Access to Jaeger collector and Prometheus (for observability)

## Installation

### Local Development

1. Clone the repository and navigate to the service directory:
   ```
   cd services/quotes-service
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the service:
   ```
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

The service will run on `http://localhost:8000` by default.

### Docker

1. Build the Docker image:
   ```
   docker build -t quotes-service .
   ```

2. Run the container:
   ```
   docker run -p 8000:8000 quotes-service
   ```

For production, use the provided `docker-compose.yml` in the parent `services` directory.

## Usage

### API Endpoints

- `GET /health`: Returns service health status in JSON format.
- `GET /quotes`: Returns all available quotes as a JSON array.
- `GET /quotes/random`: Returns a randomly selected quote.
- `GET /quotes/{quote_id}`: Returns a specific quote by its ID.

### Configuration

The service can be configured using environment variables:

- `JAEGER_HOST`: Hostname for Jaeger collector (default: jaeger-collector.observability.svc.cluster.local)
- `JAEGER_PORT`: Port for Jaeger collector (default: 6831)
- `FAIL_RATE`: Simulated failure rate (0.0 to 1.0, default: 0)

## Dependencies

- **FastAPI**: Modern, fast web framework for building APIs with Python
- **Uvicorn**: ASGI server for running FastAPI applications
- **OpenTelemetry**: Instrumentation for observability and tracing
- **Prometheus FastAPI Instrumentator**: Automatic metrics collection for Prometheus
- **Pydantic**: Data validation and serialization

See `requirements.txt` for full dependency list.

## Health Check

The service includes a health check endpoint at `/health` and a Docker health check that verifies the endpoint is responsive.

## Observability

- **Tracing**: All API endpoints are instrumented with OpenTelemetry spans, including custom attributes for quote IDs and authors.
- **Metrics**: Prometheus metrics are automatically collected and exposed at `/metrics`.
- **Logging**: Structured JSON logging for better log aggregation and analysis.

## Deployment

This service is designed to run in a containerized environment. Refer to the Kubernetes manifests in `k8s-local/quotes-svc/` for deployment configurations.

## Contributing

1. Make changes to the code.
2. Test locally.
3. Submit a pull request.

## License

This project is part of the QuotesMesh demo and follows the same licensing terms.