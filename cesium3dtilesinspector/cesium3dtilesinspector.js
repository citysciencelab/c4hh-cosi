import store from "../../src/app-store";

/**
 * Creates an inspector for tiles as shown in the example https://sandcastle.cesium.com/?src=3D%20Tiles%20Inspector.html
 * @returns {void}
 */
function createCesium3DTilesInspector () {
    const head = document.getElementsByTagName("head")[0],
        link = document.createElement("link"),
        map3D = mapCollection.getMap("3D");
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

/**
 * Checks if Cesium is defined and starts the function to create the 3D Tiles Inspector.
 * If Cesium is not defined, it will check every second until it is defined.
 * @returns {void}
 */
function checkAndCreateInspector () {
    let mapMode = store.getters["Maps/mode"];

    if (typeof Cesium !== "undefined" && mapMode === "3D") {
        createCesium3DTilesInspector();
    }
    else {
        const checkCesiumInterval = setInterval(function () {
            if (typeof Cesium !== "undefined" && mapMode === "3D") {
                clearInterval(checkCesiumInterval);
                createCesium3DTilesInspector();
            }
            else {
                mapMode = store.getters["Maps/mode"];
            }
        }, 1000);
        /*
        console.log(123);
        store.watch((_, rootGetters) => rootGetters["Maps/mode"], mapModeFromGetters => {
            console.log("drin");
            
            if (mapModeFromGetters === "3D") {
                createCesium3DTilesInspector();
            }
        });
        */
    }
}

/*
export default {
    watchMapMode ({dispatch}) {
        store.watch((_, getters) => getters["Maps/mode"], (mapMode) => {
            if (mapMode === "3D") {
                dispatch("checkAndCreateInspector");
            }
        });
    },
    checkAndCreateInspector ({dispatch}) {
        let mapMode = store.getters["Maps/mode"];

        if (typeof Cesium !== "undefined" && mapMode === "3D") {
            dispatch("createCesium3DTilesInspector");
        }
        else {
            const checkCesiumInterval = setInterval(function () {
                if (typeof Cesium !== "undefined" && mapMode === "3D") {
                    clearInterval(checkCesiumInterval);
                    dispatch("createCesium3DTilesInspector");
                }
                else {
                    mapMode = store.getters["Maps/mode"];
                }
            }, 1000);
        }
    },
    createCesium3DTilesInspector () {
        const head = document.getElementsByTagName("head")[0],
            link = document.createElement("link"),
            map3D = mapCollection.getMap("3D");
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
};
*/

checkAndCreateInspector();


export {
    createCesium3DTilesInspector
};

