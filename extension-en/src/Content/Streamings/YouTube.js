import { StreamingStrategy } from "./StreamingStrategy.js";

export class YouTube extends StreamingStrategy {
    get name() {
        return "YouTube";
    }

    get host() {
        return "www.youtube.com";
    }

    get playerSelectors() {
        return ["#ytd-player"];
    }

    get captionSelectors() {
        return [".caption-visual-line", ".captions-text", ".ytp-caption-segment"];
    }

    get menuSelectors() {
        return [
            { selector: ".ytp-settings-button", visibleAttr: "aria-expanded" },
            { selector: ".ytp-ad-skip-button", visibleAttr: null }
        ];
    }
}
