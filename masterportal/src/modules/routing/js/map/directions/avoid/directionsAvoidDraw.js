import {Draw} from "ol/interaction.js";
import directionsAvoidStyle from "./directionsAvoidStyle.js";
import directionsAvoidSource from "./directionsAvoidSource.js";

export default new Draw({
    source: directionsAvoidSource,
    type: "Polygon",
    style: directionsAvoidStyle
    // allow only left click
    // condition: e => e.pointerEvent.buttons === 1
});
