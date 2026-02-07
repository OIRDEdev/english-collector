import { StreamingStrategy } from "./StreamingStrategy.js";

export class Max extends StreamingStrategy {
    get name() {
        return "Max (HBO)";
    }

    get host() {
        return "play.hbomax.com";
    }

    get playerSelectors() {
        return [
            "div[class*='StyledPlayerContainer-Beam-Web']",
            "div[class*='StyledPlayerContainer-Fuse-Web']",
            "div[class*='PlayerRootContainer-Fuse-Web-Play']"
        ];
    }

    get captionSelectors() {
        return [
            "div[class*='CaptionWindow-Beam-Web']",
            "div[class*='CaptionWindow-Fuse-Web']",
            "div[class*='CaptionWindow-Fuse-Web-Play']"
        ];
    }
}
