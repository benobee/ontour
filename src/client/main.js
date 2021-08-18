import Vue from "vue";
import { geoEventClusters } from "./components/index";
import PubSub from "./core/events";

class App {
    constructor () {
        this.instance = new Vue(geoEventClusters);
    }
}

export const eventEmitter = new PubSub();
export const app = new App();