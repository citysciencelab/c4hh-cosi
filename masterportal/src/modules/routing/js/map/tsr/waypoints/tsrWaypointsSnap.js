import {Snap} from "ol/interaction.js";
import tsrWaypointsSource from "./tsrWaypointsSource.js";

export default new Snap({source: tsrWaypointsSource});
