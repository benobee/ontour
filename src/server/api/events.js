const MongoClient = require('mongodb').MongoClient;
const app = require('../app/app');
const mongoose = require('mongoose');
const methods = require('./methods');

// DB CONNECT
MongoClient.connect('mongodb://localhost:27018/ontour', (err, client) => {
    if (err) throw err;
    console.log("Connected successfully to server");
    const db = client.db("ontour");

    if (!db.collection("events")) {
        db.createCollection("events", (err) => {
            if (err) throw err;
        });
    }
    const events = db.collection("events");

    app.get('/api/events', (req, res) => {
        let params = {};

        // Cursor Query
        if (req.query.search) {
            params = JSON.parse(req.query.search);
            // Find
            const query = events.aggregate([{
                    $sort: { "datetime": -1 }
                },
                {
                    $lookup: {
                        from: "artists",
                        localField: "ontour_id",
                        foreignField: "_id",
                        as: "artist"
                    }
                },
                {
                    $unwind: "$artist"
                },
                {
                    $project: {
                        "artist.data.name": 1,
                        "artist.data.images": 1,
                        "artist.data.uri": 1,
                        "artist.data.id": 1,
                        "artist.data.genres": 1,
                        "artist.data.popularity": 1,
                        "artist.data.genres": 1,
                        "artist.avg_tickets_sold": 1,
                        "location": 1,
                        "genres": 1,
                        "venue": 1,
                        "datetime": 1,
                        "title": 1
                    }
                },
                {
                    $match: params
                }
            ],
            { allowDiskUse: true });

            // Sort
            if (req.query.sort) {
                query.sort(JSON.parse(req.query.sort));
            }

            // Limit
            if (req.query.limit) {
                query.limit(Number(req.query.limit));
            }

            // To Array
            query.toArray(async (err, results) => {
                if (err) {
                    console.log(err);
                }
                const tags = await methods.compileTags(results);
                console.log(`returning event results: ${results.length} records and ${tags.length} tags for the map boundary`);
                res.send(tags);
            });
        }
    })
});
