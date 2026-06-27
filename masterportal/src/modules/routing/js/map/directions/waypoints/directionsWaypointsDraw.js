import {Draw} from "ol/interaction.js";
import directionsWaypointsStyle from "./directionsWaypointsStyle.js";
import directionsWaypointsSource from "./directionsWaypointsSource.js";

export default new Draw({
    source: directionsWaypointsSource,
    type: "Point",
    style: directionsWaypointsStyle,
    // allow only left click
    condition: e => e.originalEvent.buttons === 1
});
