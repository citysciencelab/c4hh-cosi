import store from "../../src/app-store";

/**
 * Creates an inspector for tiles as shown in the example https://sandcastle.cesium.com/?src=3D%20Tiles%20Inspector.html
 * @param  {module:OLCesium} the 3d-map
 * @returns {void}
 */
function createCesium3DTilesInspector (map3D) {
    const head = document.getElementsByTagName("head")[0],
        link = document.createElement("link");
    let insp = 0;

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "https://geofos.fhhnet.stadt.hamburg.de/mastercode/cesium/latest/Widgets/widgets.css";
    link.media = "all";
    head.appendChild(link);

    insp = new Cesium.Cesium3DTilesInspector(document.getElementById("map"), map3D.getCesiumScene());
    insp._element.style.setProperty("position", "fixed");
    insp._element.style.setProperty("top", "0");
    insp._element.style.setProperty("right", "0");
}

createCesium3DTilesInspector();

store.watch((_, getters) => getters["Maps/mode"], (mapMode) => {
    if (mapMode === "3D") {
        createCesium3DTilesInspector();
    }
}
);
export {
    createCesium3DTilesInspector
};
