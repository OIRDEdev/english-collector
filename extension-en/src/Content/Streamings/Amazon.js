import { StreamingStrategy } from "./StreamingStrategy.js";

export class Amazon extends StreamingStrategy {
    get name() {
        return "Amazon Prime Video";
    }

    get host() {
        return "www.primevideo.com";
    }

    get playerSelectors() {
        return [".atvwebplayersdk-player-container"];
    }

    get captionSelectors() {
        return [".atvwebplayersdk-captions-text"];
    }
}
