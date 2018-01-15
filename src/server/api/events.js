const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    db.createCollection("events", function(err, res) {
        if (err) throw err;
    });
});
