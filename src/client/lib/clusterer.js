const turf = require("@turf/turf");

import _ from "underscore";

class CustomClusterer {
    constructor (map, googleMaps) {
        this.data = {
            markers: [],
            location: {
                country: "",
                region: "",
                city: ""
            },
            points: [],
            pointScale: [],
            featureCollection: {}
        };
        this.state = {
            updating: false
        };
        this.google = googleMaps;
        this.map = map;
        this.geoCodeService = new google.maps.Geocoder(this.map);
        this.placesService = new google.maps.places.PlacesService(this.map);
        this.events();
    }
    events () {
        this.map.addListener("zoom_changed", () => {
            if (this.map.zoom >= 7) {
                this.setMap(null);
                setTimeout(() => {
                    if (!this.state.updating) {
                        this.getMoreDetails();
                    }

                }, 100);
            } else {
                this.setMap(null);
            }
        });
        this.map.addListener("dragend", () => {
            if (this.map.zoom >= 7) {
                if (!this.state.updating) {
                    this.getMoreDetails();
                }
            }
        });
    }
    locationTest (results, callback) {
        if (results && results.length) {
            this.getPlaceDetails(results, (details) => {
                callback(details);
            });
        }
    }
    getMoreDetails () {
        const center = this.map.getCenter();

        this.geoCodeService.geocode({ location: { lat: center.lat(), lng: center.lng() } }, (results) => {
            this.locationTest(results, (details) => {
                if (details.region !== this.data.location.region) {
                    this.state.updating = true;
                    this.getEvents(details, "/api/events", {
                        sort: {
                            datetime: -1
                        },
                        search: {
                            $and: [
                                { "venue.country": details.country }
                            ],
                            $or: [
                                { "venue.region": details.region }
                            ]
                        }
                    });
                } else {
                    this.setMap(null);
                    this.data.points = this.mapClusters(this.featureCollection);
                    this.setMap(this.map);
                }
            });
        });
    }
    getPlaceDetails (results, callback) {
        const placeDetails = {
            country: "",
            region: "",
            city: ""
        };

        this.placesService.getDetails({ placeId: results[ 0 ].place_id }, (details) => {
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
            console.log(placeDetails);
            callback(placeDetails);
        });
    }
    getEvents (details, url, params) {
        this.data.location = details;
        axios.get(url, {
                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
                },
                params,
            })
            .then((response) => {
                this.data.items = response.data;
                this.data.points = this.mapFeaturePoints(response.data);
                this.featureCollection = turf.featureCollection(this.data.points);
                this.data.points = this.mapClusters(this.featureCollection);
            })
            .then(() => {
                this.setMap(this.map);
                this.state.updating = false;
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
            });
    }
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
    }
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
    mapFeaturePoints (array) {
        return array.map((item) => {
            return turf.point([item.latitude, item.longitude], { title: item.name, genres: item.genres });
        });
    }
    calculateBoundsCoordsDistance () {
        const bounds = this.map.getBounds();
        const NE = bounds.getNorthEast();
        const SW = bounds.getSouthWest();
        const line = turf.lineString([
            [NE.lat(), NE.lng()],
            [SW.lat(), SW.lng()]
        ]);

        this.bbox = turf.bbox(line);
        return turf.distance([NE.lat(), NE.lng()], [SW.lat(), SW.lng()]);
    }
    getPointsWithinBounds () {
        this.bboxPolygon = turf.bboxPolygon(this.bbox);
        this.polygon = turf.polygon([this.bboxPolygon.geometry.coordinates[ 0 ]]);

        return turf.pointsWithinPolygon(this.data.featureCollection, this.polygon);
    }
    logslider (position, topScale, minOutput, maxOutput) {
        // position will be between 0 and maximum pointscale length
        const minp = 0;
        const maxp = topScale;

        // The result should be between 10 an 24
        const minv = Math.log(minOutput);
        const maxv = Math.log(maxOutput);

        // calculate adjustment factor
        const scale = (maxv - minv) / (maxp - minp);

        return Math.exp(minv + scale * (position - minp));
    }
    createGmapsMarker (coordinates, tags) {
        const topTags = tags.slice(0, 3);
        const labels = `${topTags.map((tag) => {
                    return tag.name;
                }).join(", ")}`;

        const modifier = Math.floor(this.logslider(tags.length, this.data.pointScale[ 0 ], 10, 24));
        const scaleSize = this.logslider(tags.length, this.data.pointScale[ 0 ], 0.2, 1);
        const marker = new google.maps.Marker({
            position: {
                lat: coordinates[ 0 ],
                lng: coordinates[ 1 ]
            },
            label: {
                text: labels,
                color: `hsla(0, 0%, 29%, ${0.5 + Math.floor(modifier * 0.07)})`,
                fontSize: `${modifier}px`,
                fontWeight: "600"
            },
            icon: {
                path: "M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
                fillColor: `hsl(${198 - Math.floor(modifier)}, ${28 - modifier * 0.05}%, 82%)`,
                scale: scaleSize,
                fillOpacity: 0.5,
                strokeColor: "#c3d5dd",
                strokeWeight: 2,
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(0, 0),
                labelOrigin: new google.maps.Point(0, 25)
            }
        });

        return marker;
    }
    mapClusters (featureCollection) {
        const clusterMarkers = [];
        const tagList = [];

        this.boundsCoordsDistance = this.calculateBoundsCoordsDistance();
        this.data.pointScale = [];
        this.clustered = turf.clustersDbscan(featureCollection, this.boundsCoordsDistance * 0.05, { minPoints: 1 });

        //find tag length to establish weight for marker labels

        turf.clusterEach(this.clustered, "cluster", (cluster) => {
            const list = this.compileTags(cluster.features);

            tagList.push({ list });
            this.data.pointScale.push(list.length);
        });

        const groups = _.groupBy(this.clustered.features, (item) => {
            return item.properties.dbscan;
        });

        if (groups.noise && Array.isArray(groups.noise)) {
            groups.noise.forEach((item) => {
                const list = this.compileTags(item);

                tagList.push({ list });
                this.data.pointScale.push(list.length);
                const marker = this.createGmapsMarker(item.geometry.coordinates, list);

                clusterMarkers.push(marker);
            });
        }

        //sort points to scale google maps markers
        this.data.pointScale = _.sortBy(this.data.pointScale).reverse();

        //generate the actual google map markers
        turf.clusterEach(this.clustered, "cluster", (cluster, currentIndex) => {
            const center = turf.centerOfMass(cluster, { currentIndex });
            const tags = tagList[ currentIndex ];
            const marker = this.createGmapsMarker(center.geometry.coordinates, tags.list, cluster);

            clusterMarkers.push(marker);
        });

        return clusterMarkers;
    }
    compileTags (array) {
        if (!Array.isArray(array)) {
            array = [array];
        }
        //compile the music genre tags
        let tagList = [];

        array.forEach((item) => {
            tagList = tagList.concat(item.properties.genres);
        });

        tagList = _.map(_.groupBy(tagList, "name"), (tag) => {
            return {
                name: tag[ 0 ].name,
                weight: tag.length
            };
        });

        //reverse order the weight for higher items to be first
        tagList = _.sortBy(tagList, "weight").reverse();

        return tagList;
    }
    reset () {
        this.clusterMarkers = [];
        this.setMap(null);
    }
    setMap (map) {
        for (let i = 0; i < this.data.points.length; i++) {
            this.data.points[ i ].setMap(map);
        }
    }
}

export default CustomClusterer;