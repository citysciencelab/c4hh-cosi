import directionsRouteSource from "./directionsRouteSource.js";
import directionsRouteStyle from "./directionsRouteStyle.js";
import VectorLayer from "ol/layer/Vector.js";

export default new VectorLayer({
    id: "directions_route_layer",
    source: directionsRouteSource,
    style: directionsRouteStyle.createDirectionsRouteStyle,
    name: "directions_route_layer",
    alwaysOnTop: true
});
