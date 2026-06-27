import {Draw} from "ol/interaction.js";
import isochronesPointStyle from "./isochronesPointStyle.js";
import isochronesPointSource from "./isochronesPointSource.js";

export default new Draw({
    source: isochronesPointSource,
    type: "Point",
    style: isochronesPointStyle,
    // allow only left click
    condition: e => e.originalEvent.buttons === 1
});
