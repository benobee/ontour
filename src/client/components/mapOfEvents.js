import templateHTML from "./mapOfEvents.html";
import googleMapsClient from "../lib/googleMaps";
import axios from "axios";
import Events from "../core/events";
import customClusterer from "../lib/clusterer";
const turf = require("@turf/turf");

const mapOfEvents = () => {
    return {
        template: templateHTML,
        el: "#app",
        data () {
            return {
                google: {},
                markers: [],
                points: [],
                location: {
                    country: "",
                    region: "",
                    city: ""
                },
                updating: false,
                layer: {
                    close: [],
                    far: []
                }
            };
        },
        methods: {

            /**
             * [init description]
             * @return {[type]} [description]
             */

            init () {
                const initGoogleMap = googleMapsClient("#map");

                initGoogleMap.then((response) => {
                    this.setMapEvents();
                    Events.emit("map-loaded", response);
                });
            },

            /**
             * [api description]
             * @param  {[type]} url    [description]
             * @param  {[type]} params [description]
             * @return {[type]}        [description]
             */

            async api (url, params) {
                return axios.get(url, {
                        headers: {
                            "Cache-Control": "no-cache, no-store, must-revalidate",
                            "Access-Control-Allow-Origin": "*",
                            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
                        },
                        params
                    })
                    .catch((error) => {
                        if (error.response) {
                            console.log(error);
                        }
                    });
            },

            /**
             * [setMapEvents description]
             */

            setMapEvents () {
                Events.on("map-loaded", (config) => this.loadEvents(config));
                Events.on("map_interaction", this.interactEvents);
            },

            /**
             * [bindGoogleMapEvents description]
             * @return {[type]} [description]
             */

            bindGoogleMapEvents () {
                if (this.google.map.zoom >= 7) {
                    if (!this.updating) {
                        Events.emit("map_interaction", this.google.map);
                    }
                }
            },

            /**
             * [loadEvents description]
             * @param  {[type]} options [description]
             * @return {[type]}         [description]
             */

            loadEvents (google) {
                this.google = google;
                setTimeout(() => {
                    const bounds = this.calculateBoundsCoords(this.google.map);

                    this.api("/api/events", {
                        sort: {
                            datetime: -1
                        },
                        search: {

                            location: {
                                $geoWithin: {
                                    $box: [
                                        [bounds.SW.lng, bounds.SW.lat],
                                        [bounds.NE.lng, bounds.NE.lat]
                                    ]
                                }
                            }
                        }
                    }).then((response) => {
                        if (response) {
                            console.log({ response: response.data });
                            this.setMarkersToMap(response.data, { noise: true });
                            this.google.map.addListener("zoom_changed", this.bindGoogleMapEvents);
                            this.google.map.addListener("dragend", this.bindGoogleMapEvents);
                        }

                    }).catch((err) => {
                        console.log(err);
                    });
                }, 50);
            },

            /**
             * [setMarkersToMap description]
             * @param {[type]} points  [description]
             * @param {[type]} options [description]
             */

            setMarkersToMap (points, options) {
                const clusterer = this.getClusterer(points, options);

                this.points = points;
                clusterer.then((googleMapMarkers) => {
                    this.clearMarkers();
                    this.setMap(this.google.map, googleMapMarkers);
                    console.log({ markers: googleMapMarkers });
                }).catch((err) => {
                    console.log(err);
                });
            },

            /**
             * [interactEvents description]
             * @return {[type]} [description]
             */

            interactEvents () {
                const geocoder = this.geocodeCenterOfMap();
                const clusterer = this.getClusterer(this.points, { noise: true });

                geocoder.then((location) => {
                    this.location = location;
                });
                clusterer.then((googleMapMarkers) => {
                    this.clearMarkers();
                    this.setMap(this.google.map, googleMapMarkers);
                }).catch((err) => {
                    console.log(err);
                });
            },

            /**
             * [setMap description]
             * @param {[type]} map              [description]
             * @param {[type]} googleMapMarkers [description]
             */

            setMap (map, googleMapMarkers) {
                if (googleMapMarkers) {
                    this.markers = googleMapMarkers;
                }
                for (let i = 0; i < this.markers.length; i++) {
                    this.markers[ i ].setMap(map);
                }
            },

            /**
             * [getClusterer description]
             * @param  {[type]} points  [description]
             * @param  {[type]} options [description]
             * @return {[type]}         [description]
             */

            async getClusterer (points, options) {
                const bounds = this.calculateBoundsCoords(this.google.map);
                const clusterer = customClusterer(points, bounds, options);

                return clusterer;
            },

            /**
             * [clearMarkers description]
             * @return {[type]} [description]
             */

            clearMarkers () {
                this.setMap(null);
            },

            /**
             * [calculateBoundsCoordsDistance description]
             * @return {[type]} [description]
             */

            createPolygonFromBounds (boundsCoords) {
                const line = turf.lineString([
                    [boundsCoords.NE.lat, boundsCoords.NE.lng],
                    [boundsCoords.SW.lat, boundsCoords.SW.lng]
                ]);
                const bbox = turf.bbox(line);
                const bboxPolygon = turf.bboxPolygon(bbox);
                const polygon = turf.polygon([bboxPolygon.geometry.coordinates[ 0 ]]);

                return polygon;
            },

            /**
             * When the geocode is compled, location is set
             * and stored. This has been separated for
             * readabilty.
             *
             * @param  {Object} geocode
             */

            onGeocodeComplete (geocode, resolve) {
                const coords = this.getLocation(geocode);

                coords.then((location) => {
                    if (this.location.country !== location.country) {
                        Events.emit("country_updated", location);
                    }
                    if (this.location.region !== location.region) {
                        Events.emit("region_updated", location);
                    }
                    if (this.location.city !== location.city) {
                        Events.emit("city_updated", location);
                    }

                    resolve(location);
                });
            },

            /**
             * [geocodeCenterOfMap description]
             * @return {[type]} [description]
             */

            async geocodeCenterOfMap () {
                const promise = new Promise((resolve) => {
                    const geocode = this.geocode();

                    geocode.then((results) => {
                        this.onGeocodeComplete(results, resolve);
                    });
                });

                return promise;
            },

            /**
             * [calculateBoundsCoords description]
             * @param  {[type]} map [description]
             * @return {[type]}     [description]
             */

            calculateBoundsCoords (map) {
                let bounds = map.getBounds();

                bounds = {
                    NE: {
                        lat: bounds.getNorthEast().lat(),
                        lng: bounds.getNorthEast().lng()
                    },
                    SW: {
                        lat: bounds.getSouthWest().lat(),
                        lng: bounds.getSouthWest().lng()
                    }
                };

                return bounds;
            },

            /**
             * [getLocation description]
             * @param  {[type]} results [description]
             * @return {[type]}         [description]
             */

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

            /**
             * [geocode description]
             * @return {[type]} [description]
             */

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
            },

            /**
             * [getVenues description]
             * @return {[type]} [description]
             */

            getVenues () {
                const service = new google.maps.places.PlacesService(this.map);

                if (this.map.zoom >= 13) {
                    service.textSearch({
                        location: this.map.center,
                        query: "music venue",
                        radius: "2000"
                    }, (results) => {
                        if (results) {
                            this.markers = [];
                            const venues = this.generateVenueMarkers(results, this.map);

                            this.markers = this.markers.concat(venues);
                        }
                    });
                }
            },

            /**
             * [generateVenueMarkers description]
             * @param  {[type]} array [description]
             * @return {[type]}       [description]
             */

            generateVenueMarkers (array) {
                array.forEach((item) => {
                    const marker = new google.maps.Marker({
                        position: item.geometry.location,
                        title: item.name,
                        label: {
                            text: item.name,
                            fontWeight: "400",
                            color: "hsla(0, 0%, 29%, 0.8)",
                            fontSize: "10px"
                        },
                        icon: {
                            path: "M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
                            fillColor: "#b73131",
                            strokeColor: "#191919",
                            scale: 0.4,
                            fillOpacity: 0.8,
                            strokeWeight: 1,
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(0, 0),
                            labelOrigin: new google.maps.Point(0, 25)
                        }
                    });

                    this.markers.push(marker);
                });

                return this;
            }
        },
        mounted () {
            this.init();
        }
    };
};

export default mapOfEvents;