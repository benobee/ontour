const MongoClient = require('mongodb').MongoClient;
const app = require('../app/app');

MongoClient.connect('mongodb://localhost:27018/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    if (!db.collection('geoTags')) {
        db.createCollection("geoTags", function(err, res) {
            if (err) throw err;
        });
    }
});