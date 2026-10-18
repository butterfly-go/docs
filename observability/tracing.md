# OpenTelemetry tracing

The framework automatically configures OpenTelemetry tracing:

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
)

func processOrder(ctx context.Context, orderID string) error {
    // Create new span
    tracer := otel.Tracer("order-service")
    ctx, span := tracer.Start(ctx, "processOrder")
    defer span.End()
    
    // Add attributes
    span.SetAttributes(
        attribute.String("order.id", orderID),
        attribute.String("order.status", "processing"),
    )
    
    // Call other services
    if err := validateOrder(ctx, orderID); err != nil {
        span.RecordError(err)
        return err
    }
    
    // Add event
    span.AddEvent("order validated")
    
    return nil
}
```

Tracing is on by default and exports over OTLP. Pick the exporter with environment variables (see [Configuration](/guide/configuration#environment-variables)):

```bash
# OTLP over HTTP
export BUTTERFLY_TRACING_PROVIDER=http
export BUTTERFLY_TRACING_ENDPOINT=localhost:4318

# OTLP over gRPC (the default provider)
export BUTTERFLY_TRACING_PROVIDER=grpc
export BUTTERFLY_TRACING_ENDPOINT=localhost:4317

# No tracing, for local development
export BUTTERFLY_TRACING_DISABLE=true
```

Sampling is controlled by `otel.trace_sample_ratio` in the config file. See [Configuration](/guide/configuration#otel). HTTP requests, gRPC calls, Redis, SQL, GORM and Mongo are traced without any code on your side. Trace context is propagated in the W3C `traceparent` header.
