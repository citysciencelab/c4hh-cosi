import tsrWaypointsSource from "./tsrWaypointsSource.js";
import tsrWaypointsStyle from "./tsrWaypointsStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    source: tsrWaypointsSource,
    style: tsrWaypointsStyle,
    name: "tsr_waypoints_layer",
    alwaysOnTop: true
});
