const _ = require("underscore");
const turf = require("@turf/turf");

/**
 * [description]
 * @param  {[type]} points  [description]
 * @param  {[type]} bounds  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */

const customClusterer = (points, bounds, options) => {
    let pointScale = [];

    points = points.map((item) => {
        return turf.point([item.lng, item.lat], { genres: item.genres, events: item.events });
    });

    const config = {
        noise: false,
        minPoints: 1,
        labelWordCount: 2
    };

    Object.assign(config, options);
    const boundsCoords = bounds;
    const featureCollection = turf.featureCollection(points);
    const methods = {

        /**
         * [calculateBoundsCoordsDistance description]
         * @return {[type]} [description]
         */

        calculateBoundsCoordsDistance () {
            const line = turf.lineString([
                [boundsCoords.NE.lat, boundsCoords.NE.lng],
                [boundsCoords.SW.lat, boundsCoords.SW.lng]
            ]);

            this.bbox = turf.bbox(line);
            return turf.distance([boundsCoords.NE.lat, boundsCoords.NE.lng], [boundsCoords.SW.lat, boundsCoords.SW.lng]);
        },

        /**
         * [getPointsWithinBounds description]
         * @return {[type]} [description]
         */

        getPointsWithinBounds () {
            this.bboxPolygon = turf.bboxPolygon(this.bbox);
            this.polygon = turf.polygon([this.bboxPolygon.geometry.coordinates[ 0 ]]);

            return turf.pointsWithinPolygon(featureCollection, this.polygon);
        },

        /**
         * [logslider description]
         * @param  {[type]} position  [description]
         * @param  {[type]} topScale  [description]
         * @param  {[type]} minOutput [description]
         * @param  {[type]} maxOutput [description]
         * @return {[type]}           [description]
         */

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
        },

        /**
         * [createGmapsMarker description]
         * @param  {[type]} coordinates [description]
         * @param  {[type]} properties  [description]
         * @return {[type]}             [description]
         */

        createGmapsMarker (coordinates, properties) {
            const topTags = properties.tags.slice(0, config.labelWordCount);
            const labels = `${topTags.map((tag) => {
                    return tag.name;
                }).join(", ")}`;
            const modifier = Math.floor(this.logslider(properties.tags.length, pointScale[ 0 ], 10, 24));
            const scaleSize = this.logslider(properties.tags.length, pointScale[ 0 ], 0.2, 1);
            const marker = new google.maps.Marker({
                position: {
                    lat: coordinates[ 0 ],
                    lng: coordinates[ 1 ]
                },
                properties,
                label: {
                    text: labels,
                    color: `hsla(0, 0%, 29%, ${0.5 + Math.floor(modifier * 0.07)})`,
                    fontSize: `${modifier}px`,
                    fontWeight: "600",
                },
                icon: {
                    path: "M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z",
                    fillColor: "hsl(171, 100%, 52%)",
                    scale: scaleSize / 8,
                    fillOpacity: 0.9,
                    strokeColor: "hsl(171, 100%, 30%)",
                    strokeWeight: 2,
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(200, 150),
                    labelOrigin: new google.maps.Point(0, 0),
                    labelAnchor: new google.maps.Point(0, 0)
                },
                optimized: true,
            });

            return marker;
        },

        /**
         * [mapClusters description]
         * @param  {[type]} resolve [description]
         * @return {[type]}         [description]
         */

        mapClusters () {
            return new Promise((resolve) => {
                const clusterMarkers = [];
                const aggregatedMetaData = [];
                const boundsCoordsDistance = this.calculateBoundsCoordsDistance();
                const pointsWithin = this.getPointsWithinBounds();

                pointScale = [];
                const clustered = turf.clustersDbscan(pointsWithin, boundsCoordsDistance * 0.035, { minPoints: config.minPoints });

                //find tag length to establish weight for marker labels

                turf.clusterEach(clustered, "cluster", (cluster) => {
                    const metaData = this.compileMetaData(cluster.features);

                    aggregatedMetaData.push(metaData);
                    pointScale.push(metaData.tags.length);
                });

                if (config.noise) {
                    const groups = _.groupBy(clustered.features, (item) => {
                        return item.properties.dbscan;
                    });

                    if (groups.noise && Array.isArray(groups.noise)) {
                        groups.noise.forEach((item) => {
                            const metaData = this.compileMetaData(item);

                            aggregatedMetaData.push(metaData);
                            pointScale.push(metaData.tags.length);
                            const marker = this.createGmapsMarker(item.geometry.coordinates, metaData);

                            clusterMarkers.push(marker);
                        });
                    }
                }

                //sort points to scale google maps markers
                pointScale = _.sortBy(pointScale).reverse();

                //generate the actual google map markers
                turf.clusterEach(clustered, "cluster", (cluster, currentIndex) => {
                    const center = turf.centerOfMass(cluster, { currentIndex });
                    const metaData = aggregatedMetaData[ currentIndex ];
                    const marker = this.createGmapsMarker(center.geometry.coordinates, metaData);

                    clusterMarkers.push(marker);
                });

                resolve(clusterMarkers);
            });
        },

        /**
         * [compileMetaData description]
         * @param  {[type]} array [description]
         * @return {[type]}       [description]
         */

        compileMetaData (array) {
            let tagList = [];
            let popularity = [];
            let ticketsSold = [];
            let eventList = [];
            let avgPopularity = 0;
            let avgTicketsSold = 0;
            let artistList = [];
            const metaData = {};

            if (!Array.isArray(array)) {
                array = [array];
            }
            array.forEach((item) => {
                eventList = eventList.concat(item.properties.events);
                item.properties.events.forEach((event) => {
                    if (event.artist.data.popularity) {
                        popularity.push(event.artist.data.popularity);
                    }

                    if (event.artist.avg_tickets_sold) {
                        ticketsSold.push(event.artist.avg_tickets_sold);
                    }

                });
                tagList = tagList.concat(item.properties.genres);
            });
            Object.assign(metaData, { events: eventList });

            /* AVG TICKET SOLD */
            ticketsSold.forEach((num) => {
                if (num) {
                    avgTicketsSold += num;
                }
            });
            ticketsSold = _.sortBy(ticketsSold);
            avgTicketsSold = Math.floor(avgTicketsSold / ticketsSold.length);
            if (!isNaN(avgTicketsSold)) {
                Object.assign(metaData, {
                    ticketsSold: {
                        avg: avgTicketsSold,
                        low: ticketsSold[ 0 ],
                        high: ticketsSold[ ticketsSold.length - 1 ]
                    }
                });
            }

            /* POPULARITY AVG */
            popularity.forEach((num) => {
                if (num) {
                    avgPopularity += num;
                }
            });
            popularity = _.sortBy(popularity).slice(0, 6);
            avgPopularity = Math.floor(avgPopularity / popularity.length);
            if (!isNaN(avgPopularity)) {
                Object.assign(metaData, {
                    popularity: {
                        avg: avgPopularity,
                        low: popularity[ 0 ],
                        high: popularity[ popularity.length - 1 ]
                    }
                });
            }

            /* TAG LIST */
            tagList = _.groupBy(tagList, "name");
            tagList = _.map(tagList, (tags) => {
                let weight = tags.map((tag) => {
                    return tag.weight;
                });

                weight = weight.reduce((total, num) => {
                    return total + num;
                });

                return {
                    name: tags[ 0 ].name,
                    weight
                };
            });
            //reverse order the weight for higher items to be first
            tagList = _.sortBy(tagList, "weight").reverse();
            Object.assign(metaData, { tags: tagList });

            /* ARTIST LIST */
            artistList = _.groupBy(eventList, (item) => {
                return item.artist.data.name;
            });
            artistList = _.map(artistList, (item) => {
                const artist = {
                    id: item[ 0 ].artist.data.id,
                    name: item[ 0 ].artist.data.name,
                    popularity: item[ 0 ].artist.data.popularity,
                    images: item[ 0 ].artist.data.images,
                    genres: item[ 0 ].artist.data.genres
                };

                return artist;
            });
            artistList = _.sortBy(artistList, (item) => {
                return item.popularity;
            }).reverse();
            Object.assign(metaData, { artists: artistList });
            return metaData;
        }
    };

    return new Promise((resolve) => {
        const clusters = methods.mapClusters();

        resolve(clusters);
    });
};

export default customClusterer;