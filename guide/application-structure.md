# Application structure

An application is an `app.Config` passed to `app.New(...).Run()`. This page covers the fields, a complete example and the order in which the framework starts things.

## `app.Config`

An application is an `app.Config` handed to `app.New(...).Run()`.

| Field | Purpose |
|---|---|
| `Service` | Service name. Used for the config key, tracing and the HTTP middleware. |
| `Namespace` | Optional prefix of the Consul key (`Namespace/Service`). See [Configuration](/guide/configuration). |
| `Config` | Optional pointer to your own settings struct. See [Configuration](/guide/configuration#your-application-config). |
| `Router` | `func(*gin.Engine)`. Registers HTTP routes and middleware. See [HTTP](/guide/http). |
| `GRPCRegister` | `func(*grpc.Server)`. Registers gRPC services. Setting it starts the gRPC server. See [gRPC](/guide/grpc). |
| `GRPCUnaryInterceptors`, `GRPCStreamInterceptors` | Your own gRPC interceptors. |
| `InitFunc` | Functions run at startup, in order, after the framework's own setup. A returned error stops startup. |
| `TeardownFunc` | Functions run at shutdown, in reverse order. |
| `ShutdownTimeout` | Time budget of the whole shutdown. Default 30s. |
| `HealthChecks` | Extra readiness checks. See [Health checks](/observability/health). |

## A complete application

```go
package main

import (
    "context"
    "net/http"

    "butterfly.orx.me/core/app"
    "butterfly.orx.me/core/log"
    "butterfly.orx.me/core/store/redis"
    "github.com/gin-gonic/gin"
    "google.golang.org/grpc"
    pb "your-service/proto"
)

type MyConfig struct {
    APIKey string `yaml:"api_key"`
}

func (c *MyConfig) Print() {}

var cfg = &MyConfig{}

func main() {
    app.New(&app.Config{
        Service:   "user-service",
        Namespace: "my-namespace", // Consul key: my-namespace/user-service
        Config:    cfg,

        Router:       setupHTTPRoutes,
        GRPCRegister: setupGRPCServer,

        InitFunc: []func() error{
            warmCache,
        },
        TeardownFunc: []func() error{
            flushMetrics,
        },
    }).Run()
}

func setupHTTPRoutes(r *gin.Engine) {
    api := r.Group("/api/v1")
    {
        api.GET("/users/:id", getUser)
        api.POST("/users", createUser)
    }
    // /healthz, /readyz and /metrics are served by the framework on the admin
    // port. Do not add them here.
}

func setupGRPCServer(s *grpc.Server) {
    pb.RegisterUserServiceServer(s, &userServiceServer{})
}

func getUser(c *gin.Context) {
    log.FromContext(c.Request.Context()).Info("loading user", "id", c.Param("id"))
    c.JSON(http.StatusOK, gin.H{"id": c.Param("id")})
}

// InitFunc: runs after the stores are connected, so redis.GetClient works.
func warmCache() error {
    return redis.GetClient("cache").Set(context.Background(), "warm", "1", 0).Err()
}

func flushMetrics() error { return nil }
```

## Startup order

`Run` does this, in order. A failure at any step stops startup (`Run` panics with the error, `RunContext` returns it).

1. Choose the configuration backend (file or Consul).
2. Load your application config into `Config`.
3. Load the core configuration.
4. Configure logging (`log.level`, `log.format`, `log.add_source`).
5. Resolve and validate the listen addresses (`server.*`).
6. Set up metrics.
7. Start the admin server (`/metrics`, `/healthz`, `/readyz`). `/readyz` answers `503 starting` from now until the servers are up.
8. Set up tracing.
9. Connect the stores: Redis, SQL, GORM, Mongo, S3.
10. Register the health checks.
11. Run your `InitFunc`s, in order.
12. Start the HTTP server and, if `GRPCRegister` is set, the gRPC server. `/readyz` now reports `ready`.

Because the stores are connected before your `InitFunc`s run, you can call `redis.GetClient(...)`, `sqldb.GetDB(...)` and the like from them.

For what happens on shutdown, see [Graceful shutdown](/guide/graceful-shutdown).
