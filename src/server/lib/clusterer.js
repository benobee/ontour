const turf = require("@turf/turf");
const _ = require("underscore");

const customClusterer = {
    mapClusters (data) {
        const clusterMarkers = [];

        const markers = data.map((item) => {
            return turf.point(item.geometry.coordinates);
        });

        const featureCollection = turf.featureCollection(markers);

        const boundsCoordsDistance = this.calculateBoundsCoordsDistance();

        const clustered = turf.clustersDbscan(featureCollection, boundsCoordsDistance / 150, { minPoints: 1 });

        turf.clusterEach(clustered, "cluster", (cluster, clusterValue, currentIndex) => {
            const center = turf.centerOfMass(cluster, { currentIndex });
            const tags = this.compileTags(cluster.features);
            const topTags = tags.slice(0, 3);
            const labels = `${topTags.map((tag) => {
                return tag.name;
            }).join(", ")}`;

            const fontScale = [10, 12, 14, 16, 18];

            let fontSize = 10;

            if ((cluster.features.length > 0) && (cluster.features.length <= 50)) {
                fontSize = fontScale[ 0 ];
            } else if ((cluster.features.length >= 51) && (cluster.features.length <= 100)) {
                fontSize = fontScale[ 1 ];
            } else if ((cluster.features.length >= 101) && (cluster.features.length <= 300)) {
                fontSize = fontScale[ 2 ];
            } else if ((cluster.features.length >= 301) && (cluster.features.length <= 500)) {
                fontSize = fontScale[ 3 ];
            } else if (cluster.features.length >= 501) {
                fontSize = fontScale[ 4 ];
            }

            const marker = new google.maps.Marker({
                position: {
                    lat: center.geometry.coordinates[ 0 ],
                    lng: center.geometry.coordinates[ 1 ]
                },
                label: {
                    text: labels,
                    color: `hsla(0, 0%, 29%, ${0.8 + Math.floor(cluster.features.length / 15)})`,
                    fontSize: `${fontSize}px`,
                    fontWeight: "600"
                },
                icon: {
                    path: "M-10,0a10,10 0 1,0 20,0a10,10 0 1,0 -20,0",
                    fillColor: `hsl(${198 - Math.floor(cluster.features.length)}, ${28 - cluster.features.length * 3}%, 82%)`,
                    scale: 0.3 + Math.floor(cluster.features.length / 600),
                    fillOpacity: 0.5,
                    strokeColor: "#c3d5dd",
                    strokeWeight: 2,
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 0),
                    labelOrigin: new google.maps.Point(0, 25)
                }
            });

            clusterMarkers.push(marker);
        });

        return clusterMarkers;
    },
    compileTags (array) {
        //compile the music genre tags
        let tagList = [];

        array.forEach((item) => {
            tagList = tagList.concat(item.properties.tags);
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
}

module.exports = customClusterer;