import templateHTML from "./mapOfEvents.html";
import googleMapsClient from "../lib/googleMaps";
import axios from "axios";
import Events from "../core/events";
//import CustomClusterer from "../lib/clusterer";

const mapOfEvents = () => {
    return {
        template: templateHTML,
        el: "#app",
        methods: {
            init () {
                const google = googleMapsClient("#map");
                const data = axios.get("/api/events", {
                        headers: {
                            "Cache-Control": "no-cache, no-store, must-revalidate",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
                        },
                        params: {
                            sort: { datetime: -1 },
                            search: {
                                $and: [
                                    { "venue.country": "United States" }
                                ]
                            },
                            limit: 5000
                        }
                    })
                    .catch((error) => {
                        if (error.response) {
                            console.log(error);
                        }
                    });

                Promise.all([google, data])
                    .then((values) => {
                        this.google = values[ 0 ];
                        this.data = values[ 1 ].data;
                        Events.emit("map-loaded");

                        console.log(values);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            },
            bindMapEvents () {
                Events.on("map-loaded", () => {
                    this.google.map.addListener("zoom_changed", () => {
                        Events.emit("zoom_changed", { zoom: this.google.map.zoom });
                    });
                });

                Events.on("zoom_changed", () => {
                    const geocode = this.geocode();

                    geocode.then((results) => {
                        return this.getLocation(results);
                    });

                    console.log(geocode);
                });
            },
            getLocation (results) {
                const promise = new Promise((resolve) => {
                    const placeDetails = {
                        country: "",
                        region: "",
                        city: ""
                    };

                    this.google.services.places.getDetails({ placeId: results[ 0 ].place_id }, (details) => {
                        const region = details.address_components.filter((item) => {
                            return item.types.indexOf("administrative_area_level_1") !== -1;
                        });

                        if (region && region.length > 0) {
                            placeDetails.region = region[ 0 ].short_name;
                        }

                        const country = details.address_components.filter((item) => {
                            return item.types.indexOf("country") !== -1;
                        });

                        if (country && country.length > 0) {
                            placeDetails.country = country[ 0 ].long_name;
                        }

                        const city = details.address_components.filter((item) => {
                            return item.types.indexOf("locality") !== -1;
                        });

                        if (city && city.length > 0) {
                            placeDetails.city = city[ 0 ].long_name;
                        }

                        //resolve the promise
                        resolve(placeDetails);
                    });
                });

                return promise;
            },
            geocode () {
                const centerOfMap = this.google.map.getCenter();
                const location = {
                    lat: centerOfMap.lat(),
                    lng: centerOfMap.lng()
                };

                const promise = new Promise((resolve) => {
                    this.google.services.geocoder.geocode({ location }, (results) => {
                        resolve(results);
                    });
                });

                return promise;
            }
        },
        mounted () {
            this.init();
            this.bindMapEvents();
        }
    };
};

export default mapOfEvents;