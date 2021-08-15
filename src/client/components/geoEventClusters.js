import templateHTML from "./geoEventClusters.html";
import googleMapsClient from "../lib/googleMaps";
import PubSub from "../core/events";
import customClusterer from "../lib/clusterer";
import _ from "underscore";
import { getEventsByGeoBoundary } from "../services/geoEvents";
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
            const data = this.markers[ index ].properties;

            console.log({
                numberOfArtists: data.artists.length,
                numberOfEvents: data.events.length,
                popularityAvg: data.popularity.avg,
                ticketsSoldAvg: data.ticketsSold.avg,
                topTags: data.topTags,
            });
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
         * [setMapEvents description]
         */

        setMapEvents () {
            events.on("map-interaction", (e) => {
                this.interactEvents(e);
            });
            events.on("map-updated", (response) => {
                this.setMarkersToMap(response.data, response.options);
            });
        },

        /**
         * [getPointsWithinBounds description]
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */

        async getPointsWithinBounds () {
            this.clearMarkers();
            this.markers = [];
            this.updating = true;
            const bounds = this.calculateBoundsCoords(this.google.map);

            try {
                const response = await getEventsByGeoBoundary(bounds);

                events.emit("map-updated", { data: response.data || null });
            } catch (err) {
                console.log(err);
            } finally {
                this.updating = false;
            }
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
        const initGoogleMap = googleMapsClient("#map");

        initGoogleMap.then((google) => {
            this.setMapEvents();
            this.google = google;
            this.google.map.addListener("zoom_changed", () => {
                events.emit("map-interaction", { map: this.google.map, eventType: "zoom" });
            });
            this.google.map.addListener("dragend", () => {
                events.emit("map-interaction", { map: this.google.map, eventType: "drag" });
            });
        });
    }
};

export default geoEventClusters;