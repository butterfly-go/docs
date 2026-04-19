# MongoDB

## Configuration

```yaml
store:
  mongo:
    primary:
      uri: "mongodb://localhost:27017"
    secondary:
      uri: "mongodb://localhost:27018"
```

## Usage

```go
import (
    "butterfly.orx.me/core/store/mongo"
    "go.mongodb.org/mongo-driver/bson"
)

// Get MongoDB client through configuration key
func getUserCollection() *mongo.Collection {
    // "primary" corresponds to store.mongo.primary in configuration file
    client := mongo.GetClient("primary")
    return client.Database("myapp").Collection("users")
}

// Usage example
func findUser(id string) (*User, error) {
    collection := getUserCollection()
    
    var user User
    err := collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&user)
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}
```
