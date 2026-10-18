# Graceful shutdown

`Run` handles `SIGINT` and `SIGTERM`. On a signal, it shuts down in this order:

1. Reports not-ready on `/readyz` and gRPC health, so load balancers stop routing here. If `server.shutdown_delay` is set, it then waits that long. The servers keep serving during the wait.
2. Stops accepting new connections and drains in-flight HTTP requests and gRPC calls.
3. Runs your `TeardownFunc`s in **reverse** order, like `defer`. An error or panic in one is logged and does not stop the others.
4. Closes the framework's own resources: the Redis, SQL and Mongo clients.
5. Flushes and shuts down tracing, stops the admin server, and shuts down metrics.

The whole sequence shares one time budget, `ShutdownTimeout` (default 30s). When it runs out, remaining connections are cut. A second signal during shutdown ends the process immediately.

```go
app.New(&app.Config{
    Service:         "my-service",
    ShutdownTimeout: 20 * time.Second,
    TeardownFunc: []func() error{
        func() error { return messageQueue.Close() }, // registered first, runs last
        func() error { return myCache.Flush() },      // registered last, runs first
    },
})
```

You do not need to close clients obtained from `store/*`: the framework closes them. Resources you create yourself still need a teardown function.

## Driving the app from a context

`RunContext(ctx)` is `Run` driven by a context instead of OS signals. Cancelling `ctx` triggers the same graceful shutdown, and `RunContext` returns `nil` when it is done. It returns an error instead of panicking if startup fails.

```go
ctx, cancel := context.WithCancel(context.Background())
done := make(chan error, 1)
go func() { done <- application.RunContext(ctx) }()
// ...
cancel()
err := <-done
```

Run one application per process. It registers process-wide state such as the metrics registry and the admin port, so a second `Run` in the same process (in a test, say) is not supported. To test routes, see [Testing](/advanced/testing).
