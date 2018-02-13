const _ = require('underscore');

const methods = {
    compileTags(array) {
        let venues = array.filter((item) => {
            let hasVenue = false;

            if (item.venue) {
                Object.assign(item, item.venue);
                item.coords = [item.longitude, item.latitude];

                delete item.longitude;
                delete item.latitude;
                delete item.venue;
                hasVenue = item;
            }
            return hasVenue;
        });

        venues = _.groupBy(array, "coords");
        const venueList = [];

        for (const i in venues) {
            if (venues[i][0]) {
                //compile the music genre tags
                let tagList = [];

                venues[i].forEach((item) => {
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
                    name: venues[i][0].name,
                    events: venues[i],
                    lat: venues[i][0].coords[ 0 ],
                    lng: venues[i][0].coords[ 1 ],
                    location: venues[i][0].location
                };

                if (tagList.length >= 5) {
                    venueList.push(item);
                }
            }
        }

        return venueList.filter((item) => {
            return item.events.length > 1
        });
    }
}

module.exports = methods;