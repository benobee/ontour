/****************************************/
/******  WEBPACK SERVER CONFIG  *********/
/****************************************/

const WEBPACK_CONFIG = {};

/************************************/
/********       INPUT         *******/
/************************************/


const input = {
    name: 'server',
    target: 'node',
    entry: [
        './src/server/main.js', 
    ]
};

//extend properties to config
Object.assign(WEBPACK_CONFIG, input);



/************************************/
/********       OUTPUT        *******/
/************************************/

const output = {
    output: {
        publicPath: '/',
        path: __dirname + "/build",
        filename: "server.bundle.js"
    }
};

//extend properties to config
Object.assign(WEBPACK_CONFIG, output);


module.exports = WEBPACK_CONFIG;