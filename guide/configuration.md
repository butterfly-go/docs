# Configuration

## Environment Variable Configuration

The framework uses environment variables for configuration, all configuration items are prefixed with `BUTTERFLY_`:

```bash
# Configuration type: file or consul (default: consul)
export BUTTERFLY_CONFIG_TYPE=file

# File configuration path
export BUTTERFLY_CONFIG_FILE_PATH=/path/to/config.yaml

# Consul configuration
export BUTTERFLY_CONFIG_CONSUL_ADDRESS=consul:8500
export BUTTERFLY_CONFIG_CONSUL_NAMESPACE=my-namespace  # optional namespace prefix

# Tracing configuration
export BUTTERFLY_TRACING_ENDPOINT=localhost:4318
export BUTTERFLY_TRACING_PROVIDER=http  # or grpc (default: grpc)
export BUTTERFLY_TRACING_DISABLE=true   # set to "true" or "1" to disable tracing

# Prometheus push configuration
export BUTTERFLY_PROMETHEUS_PUSH_ENDPOINT=http://pushgateway:9091
```

## Configuration File Format

Configuration files support YAML format:

```yaml
# Core configuration
store:
  # MongoDB configuration
  mongo:
    primary:
      uri: "mongodb://localhost:27017"
    secondary:
      uri: "mongodb://localhost:27018"
  
  # Redis configuration
  redis:
    cache:
      addr: "localhost:6379"
      password: ""
      db: 0
    session:
      addr: "localhost:6380"
      password: ""
      db: 1
  
  # Database configuration
  db:
    main:
      host: "localhost"
      port: 3306
      user: "root"
      password: "password"
      db_name: "myapp"
  
  # S3-compatible object storage configuration
  s3:
    assets:
      endpoint: "s3.amazonaws.com"
      access_key_id: "AKIAIOSFODNN7EXAMPLE"   # or use "ak" field
      secret_access_key: "wJalrXUtnFEMI/K7MDENG"  # or use "sk" field
      session_token: ""       # optional
      region: "us-east-1"
      bucket: "my-assets"
      use_ssl: true
      use_path_style: false   # set to true for MinIO/custom endpoints

# Logging configuration
log:
  level: "info"        # debug, info, warn, error (default: info)
  format: "json"       # json or text (default: text)
  add_source: false    # include source file location in log entries

# OpenTelemetry configuration
otel:
  # Configuration items to be extended
```

## Consul Configuration Center

When using Consul as the configuration center, configurations are stored with the service name as the key:

```bash
# Set to use Consul
export BUTTERFLY_CONFIG_TYPE=consul
export BUTTERFLY_CONFIG_CONSUL_ADDRESS=consul:8500

# Configuration will be read from Consul KV with service name as key
# For example: service name is "user-service", then read configuration from key "user-service"
```
