# Logging

The framework provides a structured logging system based on Go's `log/slog`. Logging is automatically configured during initialization via the `log` section in the config file.

## Configuration

```yaml
log:
  level: "info"        # debug, info, warn/warning, error (default: info)
  format: "json"       # json or text (default: text)
  add_source: false    # include source file/line in log entries
```

## Core Logger

```go
import (
    "butterfly.orx.me/core/log"
)

// Create a component-scoped logger
func init() {
    logger := log.CoreLogger("user-handler")
    // logger includes "component" attribute automatically
    logger.Info("handler initialized")
}
```

## Context-based Logging

```go
import (
    "butterfly.orx.me/core/log"
    "log/slog"
)

// Get logger from context (returns default logger if none exists)
func handler(c *gin.Context) {
    ctx := c.Request.Context()
    
    // Get logger from context - always returns a valid logger
    logger := log.FromContext(ctx)
    logger.Info("handling request", "path", c.Request.URL.Path)
    
    // Create a logger with additional context
    contextLogger := slog.With("request_id", "123", "user_id", "456")
    
    // Store logger in context for downstream use
    ctx = log.WithLogger(ctx, contextLogger)
    
    // Pass context to other functions
    processRequest(ctx)
}

func processRequest(ctx context.Context) {
    // Retrieve logger from context
    logger := log.FromContext(ctx)
    
    // Use structured logging
    logger.Info("processing request",
        "step", "validation",
        "timestamp", time.Now(),
    )
    
    // Different log levels
    logger.Debug("debug info", "key", "value")
    logger.Info("info message", "count", 42)
    logger.Warn("warning", "retry", 3)
    logger.Error("error occurred", "error", err)
}
```

## Direct slog Usage

```go
func simpleLogging() {
    // Use default logger
    slog.Info("simple log message", "key", "value")
    
    // Create custom logger with attributes
    logger := slog.With("service", "user-service", "version", "1.0.0")
    logger.Info("service started")
}
```

## Custom Log Format Override

```go
import (
    "log/slog"
    "os"
)

// JSON format
jsonHandler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
    Level: slog.LevelDebug,
})
slog.SetDefault(slog.New(jsonHandler))

// Text format
textHandler := slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
    Level: slog.LevelInfo,
})
slog.SetDefault(slog.New(textHandler))
```
