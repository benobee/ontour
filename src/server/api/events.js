const MongoClient = require('mongodb').MongoClient;
const app = require('../app/app');
const mongoose = require('mongoose');
const methods = require('./methods');

// SCHEMA
mongoose.connect('mongodb://localhost:27017/ontour');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

// DB CONNECT
MongoClient.connect('mongodb://localhost:27017/ontour', (err, client) => {
    console.log("Connected successfully to server");
    const db = client.db("ontour");

    db.createCollection("events", (err, response) => {
        if (err) throw err;
    });

    const events = db.collection("events");
    const bulk = events.initializeUnorderedBulkOp();

    events.createIndex({ datetime: -1 });
    events.createIndex({ datetime: -1, 'venue.country': 1, 'venue.region': 1 });

    app.get('/api/events', (req, res) => {
        let params = {};

        if (req.query.search) {
            params = JSON.parse(req.query.search);
        }
        //FIND
        const query = events.find(params);

        //SORT
        if (req.query.sort) {
            query.sort(JSON.parse(req.query.sort));
        }
        // LIMIT
        if (req.query.limit) {
            query.limit(Number(req.query.limit));
        }

        //TO ARRAY
        query.toArray((err, results) => {
            results = methods.compileTags(results);
            res.send(results);
        });
    })
});