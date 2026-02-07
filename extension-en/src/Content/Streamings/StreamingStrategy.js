/**
 * Base class for Streaming Strategies
 */
export class StreamingStrategy {
    constructor() {
        if (this.constructor === StreamingStrategy) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * @returns {string} Service Name
     */
    get name() {
        throw new Error("Method 'name' must be implemented.");
    }

    /**
     * @returns {string} Hostname to match
     */
    get host() {
        throw new Error("Method 'host' must be implemented.");
    }

    /**
     * @returns {string[]} Selectors for the player container
     */
    get playerSelectors() {
        return [];
    }

    /**
     * @returns {string[]} Selectors for the caption text elements
     */
    get captionSelectors() {
        throw new Error("Method 'captionSelectors' must be implemented.");
    }

    /**
     * @returns {Array<{selector: string, visibleAttr: string|null}>|null} Selectors for menus (optional)
     */
    get menuSelectors() {
        return null;
    }
}
