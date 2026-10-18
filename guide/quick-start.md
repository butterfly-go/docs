# Quick Start

## A minimal service

```go
package main

import (
    "butterfly.orx.me/core/app"
    "github.com/gin-gonic/gin"
)

func main() {
    app.New(&app.Config{
        Service: "hello",
        Router: func(r *gin.Engine) {
            r.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"message": "pong"}) })
        },
    }).Run()
}
```

## Run it

Save the program as `main.go`, then run it with a local config file and tracing off:

```bash
go mod init hello && go mod tidy

echo '{}' > config.yaml
export BUTTERFLY_CONFIG_TYPE=file
export BUTTERFLY_CONFIG_FILE_PATH=./config.yaml
export BUTTERFLY_TRACING_DISABLE=true

go run .
```

```bash
curl localhost:8080/ping      # your API
curl localhost:2223/readyz    # readiness, on the admin port
curl localhost:2223/metrics   # Prometheus metrics
```

Press Ctrl-C and the service drains in-flight requests and shuts down cleanly.

::: tip
The default configuration backend is Consul. Without the `BUTTERFLY_CONFIG_*` variables above, the service tries to read its configuration from there. See [Configuration](/guide/configuration).
:::

## Where to go next

- [Application structure](/guide/application-structure): all `app.Config` fields, a complete example and the startup order.
- [Configuration](/guide/configuration): the config file, stores and your own settings.
- [Data stores](/stores/overview): Redis, SQL, GORM, MongoDB, S3.
- [Example](/advanced/example): a complete user service.
