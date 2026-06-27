import tsrRouteSource from "./tsrRouteSource.js";
import tsrRouteStyle from "./tsrRouteStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    source: tsrRouteSource,
    style: tsrRouteStyle.createtsrRouteStyle,
    name: "tsr_route_layer",
    alwaysOnTop: true
});
