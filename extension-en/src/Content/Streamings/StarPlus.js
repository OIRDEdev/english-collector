import { StreamingStrategy } from "./StreamingStrategy.js";

export class StarPlus extends StreamingStrategy {
    get name() {
        return "Star+";
    }

    get host() {
        return "www.starplus.com";
    }

    get playerSelectors() {
        return [".btm-media-player"];
    }

    get captionSelectors() {
        return [".dss-subtitle-renderer-line"];
    }
}
