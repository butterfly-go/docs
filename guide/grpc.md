# gRPC Service

The framework automatically starts a gRPC server on port 9090.

## Registration

```go
func setupGRPCServer(s *grpc.Server) {
    // Register multiple gRPC services
    pb.RegisterUserServiceServer(s, &userServer{})
    pb.RegisterAuthServiceServer(s, &authServer{})
    
    // Register gRPC reflection service (for debugging)
    reflection.Register(s)
}
```

## Implementing a Service

```go
type userServer struct {
    pb.UnimplementedUserServiceServer
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    // Implement business logic
    return &pb.User{
        Id:   req.Id,
        Name: "John Doe",
    }, nil
}
```

## Wiring with App Config

```go
func main() {
    config := &app.Config{
        Service:      "user-service",
        Router:       setupHTTPRoutes,
        GRPCRegister: setupGRPCServer,
    }
    
    application := app.New(config)
    application.Run()
}
```
