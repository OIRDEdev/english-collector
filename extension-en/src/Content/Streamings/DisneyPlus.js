import { StreamingStrategy } from "./StreamingStrategy.js";

export class DisneyPlus extends StreamingStrategy {
    get name() {
        return "Disney+";
    }

    get host() {
        return "www.disneyplus.com";
    }

    get playerSelectors() {
        return [".btm-media-player"];
    }

    get captionSelectors() {
        return [".dss-subtitle-renderer-line", ".hive-subtitle-renderer-line"];
    }
}
