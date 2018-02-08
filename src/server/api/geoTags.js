const MongoClient = require('mongodb').MongoClient;
const app = require('../app/app');

MongoClient.connect('mongodb://localhost:27017/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    db.createCollection("geoTags", function(err, res) {
        if (err) throw err;
    });
});