import directionsElevationSource from "./directionsElevationSource.js";
import directionsElevationStyle from "./directionsElevationStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    id: "directions_elevation_layer",
    source: directionsElevationSource,
    style: directionsElevationStyle,
    name: "directions_elevation_layer",
    alwaysOnTop: true
});
