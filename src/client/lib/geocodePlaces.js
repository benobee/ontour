const geocodePlaces = (coords) {
    return {

        /**
         * [geocode description]
         * @return {[type]} [description]
         */

        geocode() {
            const centerOfMap = this.google.map.getCenter();
            const bounds = this.google.map.getBounds();
            const location = {
                lat: centerOfMap.lat(),
                lng: centerOfMap.lng()
            };

            const promise = new Promise((resolve) => {
                this.google.services.geocoder.geocode({ location, bounds }, (results) => {
                    resolve(results);
                });
            });

            return promise;
        },

        /**
         * [geocodeCenterOfMap description]
         * @return {[type]} [description]
         */

        async geocodeCenterOfMap() {
            const promise = new Promise((resolve) => {
                const geocode = this.geocode();

                geocode.then((results) => {
                    this.onGeocodeComplete(results, resolve);
                });
            });

            return promise;
        },

        /**
         * [getLocation description]
         * @param  {[type]} results [description]
         * @return {[type]}         [description]
         */

        getLocation(results) {
            const promise = new Promise((resolve) => {
                const placeDetails = {
                    country: "",
                    region: "",
                    city: ""
                };

                this.google.services.places.getDetails({ placeId: results[0].place_id }, (details) => {
                    const region = details.address_components.filter((item) => {
                        return item.types.indexOf("administrative_area_level_1") !== -1;
                    });

                    if (region && region.length > 0) {
                        placeDetails.region = region[0].short_name;
                    }

                    const country = details.address_components.filter((item) => {
                        return item.types.indexOf("country") !== -1;
                    });

                    if (country && country.length > 0) {
                        placeDetails.country = country[0].long_name;
                    }

                    const city = details.address_components.filter((item) => {
                        return item.types.indexOf("locality") !== -1;
                    });

                    if (city && city.length > 0) {
                        placeDetails.city = city[0].long_name;
                    }

                    //resolve the promise
                    resolve(placeDetails);
                });
            });

            return promise;
        },

        /**
         * [getVenues description]
         * @return {[type]} [description]
         */

        getVenues() {
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
        },

        /**
         * [generateVenueMarkers description]
         * @param  {[type]} array [description]
         * @return {[type]}       [description]
         */

        generateVenueMarkers(array) {
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
    }
}

export default geocodePlaces;