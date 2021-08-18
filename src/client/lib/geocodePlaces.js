const geocodePlaces = (googleService) => {
    const google = googleService;
    const map = google.map;

    const geocodeCenterOfMap = () => {
        const centerOfMap = map.getCenter();
        const bounds = map.getBounds();
        const location = {
            lat: centerOfMap.lat(),
            lng: centerOfMap.lng()
        };

        return new Promise((resolve, reject) => {
            try {
                google.services.geocoder.geocode({ location, bounds }, (results) => {
                    resolve(results);
                });
            } catch (err) {
                reject(err);
            }
        });
    };

    return {
        async getLocation () {
            const places = await geocodeCenterOfMap();

            return new Promise((resolve, reject) => {
                const placeDetails = {
                    country: "",
                    region: "",
                    city: ""
                };

                try {
                    google.services.places.getDetails({ placeId: places[ 0 ].place_id }, (details) => {
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
                        resolve(placeDetails);
                    });
                } catch (err) {
                    reject(err);
                }
            });
        },
        getVenues () {
            return new Promise((resolve, reject) => {
                try {
                    google.services.places.textSearch({
                        location: map.center,
                        query: "music venue, concert, arena, performance, theater, stadium",
                        radius: "2000"
                    }, (results) => {
                        resolve(results);
                    });
                } catch (err) {
                    reject(err);
                }
            });

        },
    };
};

export default geocodePlaces;