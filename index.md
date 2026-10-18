---
layout: home
hero:
  name: Butterfly
  text: Go Microservice Framework
  tagline: A lightweight framework for building microservices in Go
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/butterfly-go/core
features:
  - title: Configuration Management
    details: Supports file-based YAML and Consul configuration center, with flexible environment variable overrides using the BUTTERFLY_ prefix.
  - title: Transport Layer
    details: HTTP (Gin) and gRPC servers with tracing, request ids, access logs and panic recovery built in. Twirp is supported too.
  - title: Data Storage
    details: Integrated support for GORM, MongoDB, Redis, native SQL, and S3-compatible object storage (AWS SDK v2).
  - title: Observability
    details: Prometheus metrics, OpenTelemetry tracing, and structured logging via log/slog, with trace ids in every log line.
  - title: Dependency Injection
    details: Google Wire integration for compile-time dependency injection, improving testability and maintainability.
  - title: Production Ready
    details: Liveness and readiness probes on a separate admin port, graceful shutdown that drains traffic, and Docker and Kubernetes deployment guides.
---
