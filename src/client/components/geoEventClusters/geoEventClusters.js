import templateHTML from "./geoEventClusters.html";
import googleMapsClient, { INITIAL_ZOOM_LEVEL } from "../../lib/googleMaps";
import customClusterer from "../../lib/clusterer";
import _ from "underscore";
import { getEventsByBoundary } from "../../services/geoEvents";
import geocodePlaces from "../../lib/geocodePlaces";
const turf = require("@turf/turf");

const geoEventClusters = {
    template: templateHTML,
    el: "#app",
    data () {
        return {
            google: null,
            zoomLevel: null,
            placesService: null,
            markers: [],
            points: [],
            location: {
                country: "",
                region: "",
                city: ""
            },
            fetchInProgress: false,
            layer: {
                close: [],
                far: []
            }
        };
    },

    computed: {
        isLoading () {
            return this.fetchInProgress;
        }
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

        geoMarkerEventCluster (array) {
            array = _.sortBy(array, (item) => {
                return item.hasOwnProperty("properties") && item.properties.tags.length;
            }).reverse();
            if (array[ 0 ]) {
                array.map((marker, index) => {
                    if (marker.hasOwnProperty("properties")) {
                        const topTags = marker.properties.tags.slice(0, 3).map((tag) => {
                            return tag.name;
                        });

                        marker.properties.topTags = topTags.join(", ");
                        marker.properties.artists = this.groupTopArtists(marker, topTags);
                        marker.addListener("click", () => {
                            this.toggleActiveStateOnMarker(index);
                        });
                    }
                    return marker;
                });
            }
            return array;
        },

        groupTopArtists (marker, topTags) {
            return marker.properties.artists.filter((artist) => {
                let artistWithTopTags = false;

                if (artist.genres.indexOf(topTags[ 0 ]) !== -1 ||
                    artist.genres.indexOf(topTags[ 1 ]) !== -1 ||
                    artist.genres.indexOf(topTags[ 2 ]) !== -1) {
                    artistWithTopTags = artist;
                }

                return artistWithTopTags;
            });
        },

        getRecords () {
            this.fetchInProgress = true;
            this.getPointsWithinBounds();
        },

        getClusterDetails (info) {
            this.details = info;
            console.log(info);
        },

        clearDetails () {
            this.details = null;
        },

        async getPointsWithinBounds () {
            try {
                const bounds = this.calculateBoundsCoords();
                const response = await getEventsByBoundary(bounds);

                this.fetchInProgress = false;
                this.setMarkersToMap(response.data);
            } catch (err) {
                this.fetchInProgress = false;
                console.log(err);
            }
        },

        async setMarkersToMap (points, options) {
            const bounds = this.calculateBoundsCoords(this.google.map);
            const clusteredMarkers = await customClusterer(points, bounds, options);

            this.clearMarkers();
            this.points = points;
            this.markers = [
                ...this.markers,
                ...this.geoMarkerEventCluster(clusteredMarkers)
            ];
            this.toggleActiveStateOnMarker(0);
            this.setMap();
        },

        async getVenueMarkers () {
            const response = await this.placesService.getVenues();

            return response.map((item) => {
                return new google.maps.Marker({
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
                    },
                });
            });
        },

        interactEvents () {
            const zoom = this.google.map.zoom;

            this.zoomLevel = zoom;
            if (zoom > 6) {
                this.setMarkersToMap(this.points, { noise: true });
            } else {
                this.clearMarkers();
            }
        },

        setMap (props = {
            clearMarkers: false,
        }) {
            for (let i = 0; i < this.markers.length; i++) {
                this.markers[ i ].setMap(props.clearMarkers ? null : this.google.map);
            }
            if (props.clearMarkers) {
                this.markers = [];
            }
        },

        clearMarkers () {
            this.setMap({
                clearMarkers: true,
            });
        },

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

        calculateBoundsCoords () {
            const bounds = this.google.map.getBounds();

            return {
                NE: {
                    lat: bounds.getNorthEast().lat(),
                    lng: bounds.getNorthEast().lng()
                },
                SW: {
                    lat: bounds.getSouthWest().lat(),
                    lng: bounds.getSouthWest().lng()
                }
            };
        }
    },

    mounted () {
        const initGoogleMap = googleMapsClient("#map");

        initGoogleMap.then(async (google) => {
            this.google = google;
            this.google.map.addListener("zoom_changed", () => {
                this.interactEvents();
            });
            this.google.map.addListener("dragend", () => {
                this.interactEvents();
            });
            this.placesService = geocodePlaces(google);
            this.location = await this.placesService.getLocation();
            this.zoomLevel = INITIAL_ZOOM_LEVEL;
        });
    }
};

export default geoEventClusters;