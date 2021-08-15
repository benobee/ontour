import templateHTML from "./geoEventClusters.html";
import googleMapsClient from "../lib/googleMaps";
import axios from "axios";
import PubSub from "../core/events";
import customClusterer from "../lib/clusterer";
import _ from "underscore";
const turf = require("@turf/turf");

/**
 * [description]
 * @return {[type]} [description]
 */

const events = new PubSub();
const geoEventClusters = {
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
    filters: {

        /**
         * Points the image to the local directory. A fix for now until
         * the data can be changed in the db.
         * @param  {String} image the url of the image path pointing to Spotify server.
         * @memberOf filters
         * @return {String}       The location path in the local directory.
         * @private
         */

        img (image) {
            if (image) {
                image = image.replace("https://i.scdn.co/image", "/images");
            }

            return image;
        }
    },
    methods: {

        /**
         * the initial startup method. Initiates the google map,
         * then sets map events.
         * @memberOf geoEventClusters
         */

        init () {
            const initGoogleMap = googleMapsClient("#map");

            initGoogleMap.then((response) => {
                this.setMapEvents();
                events.emit("map-loaded", response);
            });
        },

        /**
         * Switches the active state for the UI to
         * indicate which point is being selected.
         * @param  {Number} index the index of the marker list
         * @return {Object}      The google marker with the updated colors.
         */

        toggleActiveStateOnMarker (index) {
            //reset all the icons to the default state
            this.markers = this.markers.map((marker) => {
                const icon = marker.icon;

                marker.properties.selected = false;
                icon.fillColor = "hsl(171, 100%, 52%)";
                icon.strokeColor = "hsl(171, 100%, 30%)";
                marker.setIcon(icon);

                return marker;
            });

            //set the new icon to the active state
            const icon = this.markers[ index ].icon;

            this.markers[ index ].properties.selected = true;
            icon.fillColor = "hsl(349, 96%, 66%)";
            icon.strokeColor = "hsl(349, 96%, 66%)";
            this.markers[ index ].setIcon(icon);
        },

        /**
         *
         * @return {Array} [description]
         */

        geoMarkerEventCluster (array) {
            array = _.sortBy(array, (item) => {
                return item.properties.tags.length;
            }).reverse();
            if (array[ 0 ]) {
                array.map((marker, index) => {
                    const topTags = marker.properties.tags.slice(0, 3).map((tag) => {
                        return tag.name;
                    });

                    marker.addListener("click", () => {
                        this.toggleActiveStateOnMarker(index);
                    });
                    marker.properties.topTags = topTags.join(", ");
                    marker.properties.artists = this.groupTopArtists(marker, topTags);

                    return marker;
                });
            }
            return array;
        },

        /**
         * [groupTopArtists description]
         * @param  {[type]} marker  [description]
         * @param  {[type]} topTags [description]
         * @return {[type]}         [description]
         */

        groupTopArtists (marker, topTags) {
            return marker.properties.artists.filter((artist) => {
                let artistWithTopTags = false;

                if (artist.genres.indexOf(topTags[ 0 ]) !== -1 || artist.genres.indexOf(topTags[ 1 ]) !== -1 || artist.genres.indexOf(topTags[ 2 ]) !== -1) {
                    artistWithTopTags = artist;
                }

                return artistWithTopTags;
            });
        },

        /**
         * [api description]
         * @param  {[type]} url    [description]
         * @param  {[type]} params [description]
         * @return {[type]}        [description]
         */

        api (url, params) {
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
            events.on("map-loaded", (config) => this.loadEvents(config));
            events.on("map_interaction", (e) => {
                this.interactEvents(e);
            });
            events.on("points-updated", (response) => {
                this.setMarkersToMap(response.data, response.options);
            });
        },

        /**
         * [bindGoogleMapEvents description]
         * @return {[type]} [description]
         */

        bindGoogleMapEvents (eventType) {
            events.emit("map_interaction", { map: this.google.map, eventType });
        },

        /**
         * [loadEvents description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */

        loadEvents (google) {
            this.google = google;
            setTimeout(() => {
                this.google.map.addListener("zoom_changed", () => {
                    this.bindGoogleMapEvents({ eventType: "zoom" });
                });
                this.google.map.addListener("dragend", () => {
                    this.bindGoogleMapEvents({ eventType: "drag" });
                });
            }, 4000);
        },

        /**
         * [getPointsWithinBounds description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */

        getPointsWithinBounds () {
            this.updating = true;
            const bounds = this.calculateBoundsCoords(this.google.map);

            this.api("/api/events", {
                sort: {
                    events: -1
                },
                search: {
                    $and: [{
                            location: {
                                $geoWithin: {
                                    $box: [
                                        [bounds.SW.lng, bounds.SW.lat],
                                        [bounds.NE.lng, bounds.NE.lat]
                                    ]
                                }
                            }
                        },
                        {
                            $and: [{
                                datetime: {
                                    $gt: "2016-01-01T00:00:00"
                                }
                            }]
                        },
                    ]
                }
            }).then((response) => {
                this.updating = false;
                if (response) {
                    events.emit("points-updated", { data: response.data });
                }

            }).catch((err) => {
                console.log(err);
            });
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
            }).catch((err) => {
                console.log(err);
            });
        },

        /**
         * [interactEvents description]
         * @return {[type]} [description]
         */

        interactEvents () {
            const zoom = this.google.map.zoom;

            if (zoom >= 7) {
                this.setMarkersToMap(this.points, { noise: true });
            } else {
                this.clearMarkers();
            }
        },

        /**
         * [setMap description]
         * @param {[type]} map              [description]
         * @param {[type]} googleMapMarkers [description]
         */

        setMap (map, googleMapMarkers) {
            if (googleMapMarkers) {
                this.markers = this.geoMarkerEventCluster(googleMapMarkers);
            }
            for (let i = 0; i < this.markers.length; i++) {
                this.markers[ i ].setMap(map);
            }
        },

        /**
         * [getClusterer description]
         * @param  {Array} points  [description]
         * @param  {Object} options [description]
         * @return {Promise}         [description]
         */

        getClusterer (points, options) {
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
        }
    },
    mounted () {
        this.init();
    }
};

export default geoEventClusters;