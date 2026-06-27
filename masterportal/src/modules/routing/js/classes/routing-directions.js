/**
 * @description Abstracts the routing directions of external services.
 * @class RoutingDirections
 */
class RoutingDirections {
    /**
     * creates new RoutingDirections
     * @param {Array<number>} bbox - Array of [minX, minY, maxX, maxY] bounding box coordinates
     * @param {number} distance of the route in meter.
     * @param {number} duration of the route in seconds.
     * @param {Array<Array<number>>} lineString - Array of [lng, lat] coordinate pairs representing the route
    * @param {Array<number>} lineStringWaypointIndex to find out where the waypoints on the linestring are.
     */
    constructor ({
        bbox,
        distance,
        duration,
        lineString,
        lineStringWaypointIndex,
        elevationProfile
    }) {
        this.bbox = bbox;
        this.distance = distance;
        this.duration = duration;
        this.lineString = lineString;
        this.lineStringWaypointIndex = lineStringWaypointIndex;
        this.elevationProfile = elevationProfile;
        this.segments = [];
    }

    /**
     * Bbox of the route.
     * @returns {Array<number>} Array of [minX, minY, maxX, maxY] bounding box coordinates
     */
    getBbox () {
        return this.bbox;
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

    /**
     * Segments of directions from on waypoint to another.
     * @returns {Array<RoutingDirectionsSegment>} segments of directions from one waypoint to another
     */
    getSegments () {
        return this.segments;
    }

    /**
     * LineStringWaypointIndex to find out where the waypoints on the linestring are.
     * @returns {Array<number>} lineStringWaypointIndex to find out where the waypoints on the linestring are.
     */
    getLineStringWaypointIndex () {
        return this.lineStringWaypointIndex;
    }
}

export {RoutingDirections};
