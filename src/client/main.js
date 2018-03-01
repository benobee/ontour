import controller from "./core/controller";
import axios from "axios";

const App = {
    init () {
        //this.getArtists();
        this.initMap();
    },
    getArtists () {
        const config = {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
            }
        };

        axios.get("/api/artists", config)
            .then((response) => {
                controller.init(response.data);
            })
            .catch((error) => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error);

                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.error("REQUEST ERROR: ", error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log("Error", error.message);
                }

                //try again
                setTimeout(() => {
                    this.getArtists();
                }, 3000);
            });
    },
    initMap () {
        controller.init();
    }
};

App.init();

export default App;