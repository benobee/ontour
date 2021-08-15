import controller from "./core/controller";
import axios from "axios";

const App = {
    init () {
        this.getArtists();
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
                    console.log(error);
                } else if (error.request) {
                    console.error("REQUEST ERROR: ", error.request);
                } else {
                    console.log("Error", error.message);
                }

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