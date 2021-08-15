const MongoClient = require('mongodb').MongoClient
const app = require('../app/app')
const axios = require('axios')
const fs = require('fs')

module.exports = function mapAristsWithEvents(artists, artistEvents, results) {
    const getData = (index) => {
        console.log(results[index].name);
        axios.get(`https://api.bandsintown.com/artists/${encodeURIComponent(results[ index ].name)}/events.json?api_version=2.0&app_id=ONTOUR_1638&date=all`)
            .then((response) => {
                if (response.data.length > 0) {
                    response.data.map((item) => {
                        item.ontour_id = results[index]._id;

                        if (results[index].data.genres) {
                            item.genres = results[index].data.genres;
                        }
                    });
                }
                fs.writeFile(`./src/server/shows/${encodeURIComponent(results[ index ].name.replace("/", "-"))}.txt`, JSON.stringify(response.data), function(err) {
                    if (err) {
                        return console.log(err);
                    }
                });
                artists.findOneAndUpdate({ _id: results[index]._id }, { $set: { events: true } });
                artistEvents.insert(response.data);
                if (index !== results.length) {
                    getData(index + 1);
                }
            })
            .catch(error => {
                getData(index + 1);
                console.log(error);
            });
    }

    getData(0);
}

MongoClient.connect('mongodb://localhost:27018/ontour', (err, client) => {
    if (err) throw err;
    console.log("Connected successfully to server");
    const db = client.db("ontour");

    if (!db.collection('artists')) {
        db.createCollection("artists", function(err) {
            if (err) throw err;
        });
    }
    const artists = db.collection("artists");

    artists.find({ $and: [{ data: { $exists: true } }] }).sort({ 'data.popularity': -1 }).toArray((err, results) => {
        if (err) throw err;
        app.get('/api/artists', (req, res) => {
            res.send(results);
        });
    });
});
