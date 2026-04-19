# FAQ

## How to configure multiple databases?

Define multiple database connections in the configuration file:

```yaml
store:
  db:
    primary:
      host: "primary.db.com"
      port: 3306
      user: "app"
      password: "secret"
      db_name: "main"
    analytics:
      host: "analytics.db.com"
      port: 3306
      user: "reader"
      password: "secret"
      db_name: "analytics"
```

Use by key when accessing:

```go
primaryDB := sqldb.GetDB("primary")
analyticsDB := sqldb.GetDB("analytics")
```

## How to customize log format?

Configure via YAML:

```yaml
log:
  level: "debug"       # debug, info, warn, error
  format: "json"       # json or text
  add_source: true     # include source file/line
```

Or override programmatically:

```go
import (
    "log/slog"
    "os"
)

jsonHandler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
    Level: slog.LevelDebug,
})
slog.SetDefault(slog.New(jsonHandler))
```

## How to implement graceful shutdown?

The framework automatically handles graceful shutdown. Register cleanup functions:

```go
config := &app.Config{
    Service: "my-service",
    TeardownFunc: []func() error{
        func() error {
            sqlDB, _ := db.DB()
            return sqlDB.Close()
        },
        func() error {
            return messageQueue.Close()
        },
    },
}
```

## How to add rate limiting?

Implement rate limiting using middleware:

```go
import (
    "golang.org/x/time/rate"
)

func rateLimitMiddleware(rps int) gin.HandlerFunc {
    limiter := rate.NewLimiter(rate.Limit(rps), rps)
    
    return func(c *gin.Context) {
        if !limiter.Allow() {
            c.AbortWithStatusJSON(429, gin.H{
                "error": "too many requests",
            })
            return
        }
        c.Next()
    }
}

// Usage
r.Use(rateLimitMiddleware(100)) // 100 RPS
```
