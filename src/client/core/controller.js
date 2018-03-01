import Vue from "vue";
import geoEventClusters from "../components/geoEventClusters";

const controller = {
    init () {
        return new Vue(geoEventClusters);
    }
};

export default controller;