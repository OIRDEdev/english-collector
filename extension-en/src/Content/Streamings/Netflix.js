import { StreamingStrategy } from "./StreamingStrategy.js";

export class Netflix extends StreamingStrategy {
    get name() {
        return "Netflix";
    }

    get host() {
        return "www.netflix.com";
    }

    get playerSelectors() {
        return [".watch-video", ".sizing-wrapper"];
    }

    get captionSelectors() {
        return [".player-timedtext-text-container"];
    }

    get menuSelectors() {
        return [
            {
                selector: '.watch-video--speed-controls-container, [data-uia="selector-audio-subtitle"], .watch-video--selector-episode-container, .watch-video--episode-preview-container',
                visibleAttr: null
            }
        ];
    }
}
