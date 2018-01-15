const MongoClient = require('mongodb').MongoClient
const data = require('../data/artists.json')
const app = require('../startup/app');

app.get('/api', (req, res) => {
    res.send(data)
})

MongoClient.connect('mongodb://localhost:27017/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    db.createCollection("artists", function(err, res) {
        if (err) throw err;
    });
});
