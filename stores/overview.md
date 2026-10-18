# Data stores

Every store entry in the `store` section of the [configuration](/guide/configuration#core-configuration-reference) is connected at startup, before your `InitFunc`s run. Fetch a client by its config key:

| Store | Config key | Getter | Returns |
|---|---|---|---|
| Redis | `store.redis.<name>` | `redis.GetClient(name)` | `*redis.Client` ([go-redis v9](https://github.com/redis/go-redis)) |
| SQL | `store.db.<name>` | `sqldb.GetDB(name)` | `*sql.DB` |
| GORM | `store.db.<name>` (MySQL only) | `gorm.GetDB(name)` | `*gorm.DB` |
| MongoDB | `store.mongo.<name>` | `mongo.GetClient(name)` | `*mongo.Client` ([driver v2](https://pkg.go.dev/go.mongodb.org/mongo-driver/v2)) |
| S3 | `store.s3.<name>` | `s3.GetClient(name)`, `s3.GetBucket(name)` | `*s3.Client` ([AWS SDK v2](https://pkg.go.dev/github.com/aws/aws-sdk-go-v2/service/s3)), bucket name |

Things that apply to all of them:

- **An unknown name returns `nil`** (`""` for `GetBucket`). The getters do not panic, so a typo in a name shows up as a nil pointer when you first use the client. Fetch clients once, at startup, to find mistakes early.
- **Tracing and metrics are built in** for Redis, SQL, GORM and Mongo: each query becomes a span, and the SQL pool reports connection stats on `/metrics`.
- **The framework closes the clients** (Redis, SQL, Mongo) during [graceful shutdown](/guide/graceful-shutdown), after your `TeardownFunc`s. Do not close them yourself.
- **Readiness checks** ping every Redis, SQL and Mongo client, so `/readyz` fails while one of them is unreachable. S3 is not checked. See [Health checks](/observability/health).
