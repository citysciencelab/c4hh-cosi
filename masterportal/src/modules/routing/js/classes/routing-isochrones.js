/**
 * @description Abstracts the search results of isochrones.
 * @class RoutingIsochrones
 */
class RoutingIsochrones {
    /**
     * creates new RoutingIsochrones
     * @param {Array<number>} bbox - Array of [minX, minY, maxX, maxY] bounding box coordinates
     */
    constructor (bbox) {
        this.bbox = bbox;
        this.areas = [];
    }

    /**
     * BBOX of all areas.
     * @returns {Array<number>} Array of [minX, minY, maxX, maxY] bounding box coordinates
     */
    getBbox () {
        return this.bbox;
    }

    /**
     * Get all areas of isochrones.
     * @returns {Array<RoutingIsochronesArea>} areas of isochrones.
     */
    getAreas () {
        return this.areas;
    }

    /**
     * Adds area.
     * @param {RoutingIsochronesArea} area to add
     * @returns {void}.
     */
    addArea (area) {
        return this.areas.push(area);
    }
}

export {RoutingIsochrones};
