/**
 * @description Abstracts the routing directions of external services.
 * @class RoutingTSRDirections
 */
class RoutingTSRDirections {
    /**
     * creates new RoutingDirections
     * @param {Array<number>} bbox - Array of [minX, minY, maxX, maxY] bounding box coordinates
     * @param {number} distance of the route in meter.
     * @param {number} duration of the route in seconds.
     * @param {Array<Array<number>>} lineString - Array of [lng, lat] coordinate pairs representing the route
     * @param {Array<number>} lineStringWaypointIndex to find out where the waypoints on the linestring are.
     */
    constructor ({
        distance,
        duration,
        lineString,
        lineStringWaypointIndex,
        steps,
        elevationProfile
    }) {
        this.distance = distance;
        this.duration = duration;
        this.lineString = lineString;
        this.lineStringWaypointIndex = lineStringWaypointIndex;
        this.segments = [];
        this.steps = steps;
        this.elevationProfile = elevationProfile;
    }

    /**
     * Distance of the route in meter.
     * @returns {number} distance of the route in meter.
     */
    getDistanceMeter () {
        return this.distance;
    }

    /**
     * Duration of the route in seconds.
     * @returns {number} duration of the route in seconds.
     */
    getDurationSeconds () {
        return this.duration;
    }

    /**
     * LineString of the route
     * @returns {Array<Array<number>>} lineString - Array of [lng, lat] coordinate pairs representing the route
     */
    getLineString () {
        return this.lineString;
    }
}

export {RoutingTSRDirections};

