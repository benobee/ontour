const express = require('express')
const app = express()
const data = require('./data/artists.json');
const axios = require('axios');
const fs = require('fs');
const Mongod = require('mongod');

const server = new Mongod(27017);

/*server.open((err) => {
  if (err === null) {
    // You may now connect a client to the MongoDB
    // server bound to port 27017.
  }
});*/

app.set('port', process.env.PORT || 3000);

app.get('/api', (req, res) => {
    res.send(data)
})

app.listen(3000, () => {
    console.log('Example app listening on port 3000 !')
})

app.use(function(err, req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();

    console.error(err.stack)
    res.status(500).send('Something broke dude!')
});

/*axios.get('https://api.bandsintown.com/artists/radiohead/events.json?api_version=2.0&app_id=ONTOUR_1638&date=all')
    .then(response => {
        console.log(response);
        fs.writeFile("radiohead.txt", JSON.stringify(response.data), function(err) {
            if (err) {
                return console.log(err);
            }
        });

    })
    .catch(error => {
        console.log(error);
    });*/

/*const options = {
    host: 'http://api.bandsintown.com/artists/radiohead/events.json?api_version=2.0&app_id=ONTOUR_1638&date=all',
    path: '/artists/radiohead/events.json?api_version=2.0&app_id=ONTOUR_1638&date=all',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};*/


//////////////////////////////////////

/*let jsonData = JSON.stringify({ name: "ben", age: 39 });

jsonData = JSON.parse(jsonData);

const newData = { event: "sailing" };

jsonData.hobbies = newData;
jsonData = JSON.stringify(jsonData);

fs.writeFile("test.txt", jsonData, function(err) {
    if (err) {
        return console.log(err);
    }
});*/