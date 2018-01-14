const express = require('express')
const app = express()
const data = require("./data/artists.json");
const bodyParser = require('body-parser');

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

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  // some other closing procedures go here
  process.exit(1);
});