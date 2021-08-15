import { ontourClient } from "../lib/ontourClient";

export const getEventsByGeoBoundary = (bounds) => {
    const client = ontourClient();

    return new Promise(async (resolve, reject) => {

        try {
            const response = await client.get("/events", {
                params: {
                    sort: {
                        events: -1
                    },
                    search: {
                        $and: [{
                            location: {
                                $geoWithin: {
                                    $box: [
                                        [bounds.SW.lng, bounds.SW.lat],
                                        [bounds.NE.lng, bounds.NE.lat]
                                    ]
                                }
                            }
                        },
                        {
                            $and: [{
                                datetime: {
                                    $gt: "2016-01-01T00:00:00"
                                }
                            }]
                        },
                        ]
                    }
                }
            });

            resolve(response);
        } catch (err) {
            console.log(err);
            reject(err);
        }
    });
};