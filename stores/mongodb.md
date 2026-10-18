# MongoDB

## Configuration

```yaml
store:
  mongo:
    primary:
      uri: "mongodb://localhost:27017"
```

The key (`cache`, `main`, ...) is the name you pass to the getter. See [Data stores](/stores/overview) for behavior shared by all stores, and the [configuration reference](/guide/configuration#core-configuration-reference) for every option.

## Usage

```go
import (
    "context"

    "butterfly.orx.me/core/store/mongo"
    "go.mongodb.org/mongo-driver/v2/bson"
)

func findUser(ctx context.Context, id string) (*User, error) {
    // "primary" is store.mongo.primary in the configuration file.
    client := mongo.GetClient("primary")
    collection := client.Database("myapp").Collection("users")

    var user User
    if err := collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user); err != nil {
        return nil, err
    }
    return &user, nil
}
```

The framework's `mongo` package only provides `GetClient`. Types such as `*mongo.Collection` come from `go.mongodb.org/mongo-driver/v2/mongo`.
