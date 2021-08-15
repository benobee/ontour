import controller from "./core/controller";
import PubSub from "./core/events";

class App {
    init () {
        controller.init();
    }
}

export const eventEmitter = new PubSub();
export const app = new App().init();