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

When using Consul as the configuration center, the framework reads a **single YAML value** from Consul KV using a computed config key:

```bash
export BUTTERFLY_CONFIG_TYPE=consul
export BUTTERFLY_CONFIG_CONSUL_ADDRESS=consul:8500
export BUTTERFLY_CONFIG_CONSUL_NAMESPACE=my-namespace  # optional
```

### Config Key Computation

The Consul KV key is derived from `app.Config`:

| Service | Namespace | Consul KV Key |
|---------|-----------|---------------|
| `order` | _(empty)_ | `order` |
| `order` | `prod` | `prod/order` |
| `order` | `/prod/` | `prod/order` |

In code (`app.Config.ConfigKey()`):
```go
// If Namespace is set: trim slashes + "/" + Service
// Otherwise: just Service
```

### Unmarshal Flow

The framework reads the **same key twice** from Consul, unmarshaling the YAML into two different structs:

```
Consul KV: key="prod/order" → value (single YAML document)
   │
   ├─→ yaml.Unmarshal → *mod.CoreConfig   (framework config: store, log, otel)
   │
   └─→ yaml.Unmarshal → app.Config.Config (user-defined AppConfig struct)
```

Both structs are populated from the same YAML document. The framework extracts fields it knows (`store`, `log`, `otel`), while your custom config struct extracts its own fields. Unknown fields are silently ignored by `gopkg.in/yaml.v3`.

### Example: Combined YAML in Consul

Store this YAML as the value for key `prod/order` in Consul KV:

```yaml
# Framework fields → unmarshaled into mod.CoreConfig
store:
  redis:
    cache:
      addr: "redis:6379"
      password: ""
      db: 0
  mongo:
    primary:
      uri: "mongodb://mongo:27017"
log:
  level: "info"
  format: "json"

# Application fields → unmarshaled into your AppConfig struct
api_key: "sk-xxxx"
max_retries: 3
feature_flags:
  enable_new_checkout: true
```

Your application config struct:
```go
type MyConfig struct {
    APIKey       string `yaml:"api_key"`
    MaxRetries   int    `yaml:"max_retries"`
    FeatureFlags struct {
        EnableNewCheckout bool `yaml:"enable_new_checkout"`
    } `yaml:"feature_flags"`
}

func (c *MyConfig) Print() {}  // implement AppConfig interface
```

Both `mod.CoreConfig` and `MyConfig` are populated from this single YAML document.
