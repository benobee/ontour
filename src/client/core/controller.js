import Vue from "vue";
import { geoEventClusters } from "../components";

const controller = {
    init () {
        return new Vue(geoEventClusters);
    }
};

export default controller;