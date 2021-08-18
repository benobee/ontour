import axios from "axios";

export const ontourClient = () => {
    return axios.create({
        baseURL: "/api/",
        headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
        },
    });
};
