import {Draw} from "ol/interaction.js";
import directionsAvoidPointStyle from "./directionsAvoidPointStyle.js";
import directionsAvoidPointSource from "./directionsAvoidPointSource.js";

export default new Draw({
    source: directionsAvoidPointSource,
    type: "Point",
    style: directionsAvoidPointStyle
});
