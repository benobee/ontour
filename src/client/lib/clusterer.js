const _ = require("underscore");
const turf = require("@turf/turf");

const customClusterer = (points, bounds, options) => {
    let pointScale = [];

    points = points.map((item) => {
        return turf.point([item.lng, item.lat], { title: item.name, genres: item.genres });
    });

    const config = {
        noise: false,
        minPoints: 1
    };

    Object.assign(config, options);
    const boundsCoords = bounds;
    const featureCollection = turf.featureCollection(points);
    const methods = {
        calculateBoundsCoordsDistance () {
            const line = turf.lineString([
                [boundsCoords.NE.lat, boundsCoords.NE.lng],
                [boundsCoords.SW.lat, boundsCoords.SW.lng]
            ]);

            this.bbox = turf.bbox(line);
            return turf.distance([boundsCoords.NE.lat, boundsCoords.NE.lng], [boundsCoords.SW.lat, boundsCoords.SW.lng]);
        },
        getPointsWithinBounds () {
            this.bboxPolygon = turf.bboxPolygon(this.bbox);
            this.polygon = turf.polygon([this.bboxPolygon.geometry.coordinates[ 0 ]]);

            return turf.pointsWithinPolygon(featureCollection, this.polygon);
        },
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
        createGmapsMarker (coordinates, tags) {
            const topTags = tags.slice(0, 3);
            const labels = `${topTags.map((tag) => {
                    return tag.name;
                }).join(", ")}`;

            const modifier = Math.floor(this.logslider(tags.length, pointScale[ 0 ], 10, 24));
            const scaleSize = this.logslider(tags.length, pointScale[ 0 ], 0.2, 1);
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
        },
        mapClusters (resolve) {
            const clusterMarkers = [];
            const tagList = [];
            const boundsCoordsDistance = this.calculateBoundsCoordsDistance();
            const pointsWithin = this.getPointsWithinBounds();

            pointScale = [];
            const clustered = turf.clustersDbscan(pointsWithin, boundsCoordsDistance * 0.02, { minPoints: config.minPoints });

            //find tag length to establish weight for marker labels

            turf.clusterEach(clustered, "cluster", (cluster) => {
                const list = this.compileTags(cluster.features);

                tagList.push({ list });
                pointScale.push(list.length);
            });

            if (config.noise) {
                const groups = _.groupBy(clustered.features, (item) => {
                    return item.properties.dbscan;
                });

                if (groups.noise && Array.isArray(groups.noise)) {
                    groups.noise.forEach((item) => {
                        const list = this.compileTags(item);

                        tagList.push({ list });
                        pointScale.push(list.length);
                        const marker = this.createGmapsMarker(item.geometry.coordinates, list);

                        clusterMarkers.push(marker);
                    });
                }
            }

            //sort points to scale google maps markers
            pointScale = _.sortBy(pointScale).reverse();

            //generate the actual google map markers
            turf.clusterEach(clustered, "cluster", (cluster, currentIndex) => {
                const center = turf.centerOfMass(cluster, { currentIndex });
                const tags = tagList[ currentIndex ];
                const marker = this.createGmapsMarker(center.geometry.coordinates, tags.list, cluster);

                clusterMarkers.push(marker);
            });

            resolve(clusterMarkers);
        },
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
    };

    const promise = new Promise((resolve) => {
        methods.mapClusters(resolve);
    });

    return promise;
};

export default customClusterer;