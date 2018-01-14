import Vue from "vue";
import collectionList from "../components/collectionList";

const controller = {
    init (data) {
        const list = new Vue(collectionList(data));

        return list;
    }
};

export default controller;