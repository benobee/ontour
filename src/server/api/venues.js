const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27018/ontour', (err, client) => {
    console.log("Connected successfully to server");

    const db = client.db("ontour");

    if (!db.collection('venues')) {
        db.createCollection("venues", function(err, res) {
            if (err) throw err;
        });
    }
});


