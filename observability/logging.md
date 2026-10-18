# Logging

The framework provides a structured logging system based on Go's `log/slog`. Logging is automatically configured during initialization via the `log` section in the config file.

## Log configuration

Configure logging in your YAML config:

```yaml
log:
  level: "info"        # debug, info, warn/warning, error (default: info)
  format: "json"       # json or text (default: text)
  add_source: false    # include source file/line in log entries
```

## Logger in the context

Use `log.FromContext(ctx)` instead of the global `slog` functions inside handlers. It returns the logger carried by the context, or `slog.Default()` when there is none, so it never returns nil:

```go
import "butterfly.orx.me/core/log"

func handler(c *gin.Context) {
    logger := log.FromContext(c.Request.Context())
    logger.Info("handling request", "path", c.Request.URL.Path)
    // {"msg":"handling request","request_id":"...","trace_id":"...","span_id":"...","path":"/users"}
}
```

For HTTP requests the built-in middleware has already put a logger with `request_id` into the context (see [HTTP](/guide/http#gin-framework-integration)), and `FromContext` adds the trace ids. In gRPC handlers the context carries the trace ids as well.

To add your own fields for the rest of a call, attach an extended logger and pass the context on:

```go
func processOrder(ctx context.Context, order *Order) error {
    logger := log.FromContext(ctx).With("order_id", order.ID)
    ctx = log.WithLogger(ctx, logger)

    return charge(ctx, order) // log.FromContext(ctx) in charge includes order_id
}
```

## Correlating logs with traces

When the context carries an OpenTelemetry span, `log.FromContext(ctx)` adds `trace_id` and `span_id` to the logger, so you can jump from a log line to its trace (and back). This works for HTTP requests (via the built-in `otelgin` middleware) and gRPC calls, and for any span you start yourself:

```go
func handler(c *gin.Context) {
    ctx := c.Request.Context()
    log.FromContext(ctx).Info("start")           // trace_id=T span_id=A

    ctx, span := tracer.Start(ctx, "load-profile")
    defer span.End()
    log.FromContext(ctx).Info("loading profile") // trace_id=T span_id=B (the child span)
}
```

The ids are read when you call `FromContext`, so call it again after starting a child span. A logger created earlier, or one obtained from `slog.Default()` directly, will not pick up the new span. Without a span in the context, `FromContext` returns the logger unchanged. The attribute names are available as `log.TraceIDKey` and `log.SpanIDKey`.
