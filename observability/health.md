# Health checks

The admin server (default `:2223`, see `server.admin.addr`) serves two probe endpoints next to `/metrics`:

| Endpoint | Meaning | Status |
|---|---|---|
| `GET /healthz` | Liveness: the process is up. Never looks at dependencies, so a database outage does not get the pod restarted. | Always `200` |
| `GET /readyz` | Readiness: should this instance receive traffic? | `200` or `503` |

`/readyz` depends on the lifecycle state:

- `starting`: initialization has not finished and the servers are not listening yet. Returns `503`.
- `ready`: the dependency checks run. Returns `200` if all pass, `503` if any fails.
- `draining`: shutdown has begun. Returns `503`, so load balancers stop routing here while in-flight requests finish.

```json
{"status":"fail","state":"ready","checks":{"redis/cache":{"status":"ok","duration_ms":1},"sql/main":{"status":"fail","duration_ms":2000}}}
```

Error details are written to the log (only when a check starts failing or recovers) and never put in the response, because they can contain hostnames or credentials.

**Built-in checks** cover every configured Redis (`redis/<name>`), SQL (`sql/<name>`) and Mongo (`mongo/<name>`) client. Note that Mongo and SQL are allowed to start while unreachable (a failed ping at startup is only a warning), so such an instance starts but reports not ready until the dependency comes back. S3 is not checked by default; register your own check if you need one.

**Your own checks** go in `app.Config.HealthChecks`. Names must be unique:

```go
config := &app.Config{
    Service: "my-service",
    HealthChecks: []app.HealthCheck{{
        Name: "payments-api",
        Check: func(ctx context.Context) error {
            // ctx carries the per-check timeout (2s); honor it.
            return paymentsClient.Ping(ctx)
        },
    }},
}
```

Checks run concurrently, each with a 2s timeout, and a check that panics or hangs counts as failed. Results are cached for 1s, so a burst of probes costs one round of pings.

**gRPC:** when `GRPCRegister` is set, the standard `grpc.health.v1.Health` service is registered automatically and reports the same readiness (`SERVING` / `NOT_SERVING`) for every service name, including `Watch`. If your `GRPCRegister` registers its own health service, yours is kept and nothing is added.

**Zero-downtime shutdown:** on a shutdown signal the instance first goes `draining`, then stops the servers. Load balancers need a moment to notice, so you can pause in between:

```yaml
server:
  shutdown_delay: 5s   # default 0; must be smaller than ShutdownTimeout
```

During the delay the servers keep accepting traffic. The delay counts against `ShutdownTimeout` (default 30s).
