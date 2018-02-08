import Vue from "vue";
import mapOfEvents from "../components/mapOfEvents";

const controller = {
    init (data) {
        return new Vue(mapOfEvents(data));
    }
};

export default controller;