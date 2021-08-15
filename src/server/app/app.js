const express = require('express');
const app = express();
const HTTP = require('http').Server(app);

app.use( express.json() ); 
app.use(function(err, req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();

    console.error(err.stack)
    res.status(500).send('Something went wrong...');
});

HTTP.listen(process.env.PORT || 3000);

module.exports = app;