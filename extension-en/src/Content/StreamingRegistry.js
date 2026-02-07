import { Netflix } from "./Streamings/Netflix.js";
import { YouTube } from "./Streamings/YouTube.js";
import { Amazon } from "./Streamings/Amazon.js";
import { DisneyPlus } from "./Streamings/DisneyPlus.js";
import { Max } from "./Streamings/Max.js";
import { StarPlus } from "./Streamings/StarPlus.js";

export class StreamingRegistry {
    constructor() {
        this.strategies = [
            new Netflix(),
            new YouTube(),
            new Amazon(),
            new DisneyPlus(),
            new Max(),
            new StarPlus()
        ];
    }

    /**
     * Detects the current streaming service based on the hostname.
     * @returns {StreamingStrategy|null}
     */
    detect() {
        const hostname = window.location.hostname;
        for (const strategy of this.strategies) {
            if (hostname.includes(strategy.host) || strategy.host.includes(hostname)) {
                return strategy;
            }
        }
        return null;
    }
}
