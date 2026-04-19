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
    details: Built-in HTTP server (Gin), gRPC server on port 9090, and Twirp RPC support out of the box.
  - title: Data Storage
    details: Integrated support for GORM, MongoDB, Redis, native SQL, and S3-compatible object storage (AWS SDK v2).
  - title: Observability
    details: Prometheus metrics on port 2223, OpenTelemetry distributed tracing, and structured logging via log/slog.
  - title: Dependency Injection
    details: Google Wire integration for compile-time dependency injection, improving testability and maintainability.
  - title: Production Ready
    details: Graceful shutdown, health checks, Docker & Kubernetes deployment support, and testing utilities built in.
---
