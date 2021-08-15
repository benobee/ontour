import load from "load-script-global";

const styles = [{
        elementType: "geometry",
        stylers: [{
            color: "#f5f5f5"
        }]
    },
    {
        elementType: "labels.icon",
        stylers: [{
            visibility: "off"
        }]
    },
    {
        elementType: "labels.text.fill",
        stylers: [{
            color: "#616161"
        }]
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{
            color: "#f5f5f5"
        }]
    },
    {
        featureType: "administrative.land_parcel",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#bdbdbd"
        }]
    },
    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{
            color: "#eeeeee"
        }]
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#757575"
        }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{
            color: "#e5e5e5"
        }]
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#9e9e9e"
        }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{
            color: "#ffffff"
        }]
    },
    {
        featureType: "road.arterial",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#757575"
        }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{
            color: "#dadada"
        }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#616161"
        }]
    },
    {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#9e9e9e"
        }]
    },
    {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{
            color: "#e5e5e5"
        }]
    },
    {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{
            color: "#eeeeee"
        }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{
            color: "#c9c9c9"
        }]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{
            color: "#9e9e9e"
        }]
    }
];

const maps = (target) => {
    const promise = new Promise((resolve, reject) => {
        load({
            url: "https://maps.googleapis.com/maps/api/js?key=AIzaSyCM7daFEKrG81GE1dYe7AxRVOIVM89_Cvw&libraries=places",
            global: "google",
            jsonp: true
        }, (err, google) => {
            if (err) {
                console.log(err);
                reject();
            }

            let targetElement = {};

            if (typeof target === "string") {
                targetElement = document.querySelector(target);
            } else {
                targetElement = target;
            }

            const map = new google.maps.Map(targetElement, {
                zoom: 8,
                center: { lat: 47.6062, lng: -122.3321 },
                styles
            });

            map.setOptions({ minZoom: 5, maxZoom: 22 });

            const services = {
                geocoder: new google.maps.Geocoder(map),
                places: new google.maps.places.PlacesService(map)
            };

            const client = {
                map,
                client: google,
                services
            };

            resolve(client);
        });
    });

    return promise;
};

export default maps;