import tsrElevationSource from "./tsrElevationSource.js";
import tsrElevationStyle from "./tsrElevationStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    source: tsrElevationSource,
    style: tsrElevationStyle,
    name: "tsr_elevation_layer",
    alwaysOnTop: true
});
