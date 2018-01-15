require("./artists.js")
require("./events.js")
require("./venues.js")

/*const axios = require('axios');
const fs = require('fs');
*/
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