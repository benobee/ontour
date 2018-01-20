const MongoClient = require('mongodb').MongoClient;
const app = require('../app/app');

MongoClient.connect('mongodb://localhost:27017/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    db.createCollection("events", function(err, res) {
        if (err) throw err;
    });

    const events = db.collection("events");

    const results = events.find().limit(50).toArray((err, results) => {
        app.get('/api/events', (req, res) => {
            res.send(results);
        })
    });
});
