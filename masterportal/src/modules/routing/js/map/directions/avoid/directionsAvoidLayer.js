import directionsAvoidSource from "./directionsAvoidSource.js";
import directionsAvoidStyle from "./directionsAvoidStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    id: "directions_avoid_layer",
    source: directionsAvoidSource,
    style: directionsAvoidStyle,
    name: "directions_avoid_layer",
    alwaysOnTop: true
});
