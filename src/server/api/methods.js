const _ = require('underscore');

const methods = {
    compileTags(array) {
        let geoEventGroup = array.filter((item) => {
            let hasVenue = false;

            if (item.venue) {
                item.coords = [item.location.coordinates[ 0 ], item.location.coordinates[ 1 ]];
                delete item.location;
                hasVenue = true;
            }
            return hasVenue;
        });

        geoEventGroup = _.groupBy(array, "coords");
        const mappedGeoEvent = [];

        for (const i in geoEventGroup) {
            if (geoEventGroup[i][0]) {
                //compile the music genre tags
                let tagList = [];

                _.each(geoEventGroup[i], (item) => {
                    tagList = tagList.concat(item.genres);
                });
                tagList = _.map(_.groupBy(tagList), (item) => {
                    return {
                        name: item[0],
                        weight: item.length
                    };
                });

                //reverse order the weight for higher items to be first
                tagList = _.sortBy(tagList, "weight").reverse();

                const item = {
                    genres: tagList,
                    name: geoEventGroup[i][0].name,
                    events: geoEventGroup[i],
                    lat: geoEventGroup[i][0].coords[ 0 ],
                    lng: geoEventGroup[i][0].coords[ 1 ],
                    location: geoEventGroup[i][0].location
                };

                if (tagList.length >= 5) {
                    mappedGeoEvent.push(item);
                }
            }
        }

        return new Promise((resolve, reject) => {
            resolve(mappedGeoEvent
                .filter((item) => {
                    return item.events.length > 1
                }))
        });
    }
}

module.exports = methods;