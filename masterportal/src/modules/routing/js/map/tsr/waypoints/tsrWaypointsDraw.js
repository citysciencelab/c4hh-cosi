import {Draw} from "ol/interaction.js";
import tsrWaypointsStyle from "./tsrWaypointsStyle.js";
import tsrWaypointsSource from "./tsrWaypointsSource.js";

export default new Draw({
    source: tsrWaypointsSource,
    type: "Point",
    style: tsrWaypointsStyle,
    // allow only left click
    condition: e => e.originalEvent.buttons === 1
});
