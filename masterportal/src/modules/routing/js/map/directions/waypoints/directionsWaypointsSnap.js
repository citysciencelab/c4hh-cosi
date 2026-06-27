import {Snap} from "ol/interaction.js";
import directionsWaypointsSource from "./directionsWaypointsSource.js";

export default new Snap({source: directionsWaypointsSource});
