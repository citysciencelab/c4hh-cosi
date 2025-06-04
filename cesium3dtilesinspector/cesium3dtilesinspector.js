import store from "../../src/app-store";

/**
 * Creates an inspector for tiles as shown in the example https://sandcastle.cesium.com/?src=3D%20Tiles%20Inspector.html
 * This function checks the state of the menu and the map mode every second and creates or removes the inspector accordingly.
 * It also adds drag-and-drop functionality to the inspector.
 * @returns {void}
 */
function createCesium3dTilesInspector () {
    const head = document.getElementsByTagName("head")[0],
        link = document.createElement("link"),
        map3D = mapCollection.getMap("3D");
    let insp = null,
        lastRightPos = null;

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "https://geofos.fhhnet.stadt.hamburg.de/mastercode/cesium/latest/Widgets/widgets.css";
    link.media = "all";
    head.appendChild(link);

    setInterval(() => {
        const isExpanded = store.getters["Menu/secondaryMenu"].expanded,
            mapMode = store.getters["Maps/mode"];

        if (mapMode === "3D") {
            if (!insp) {
                insp = new Cesium.Cesium3DTilesInspector(document.getElementById("map"), map3D.getCesiumScene());
                insp._element.style.position = "fixed";
                insp._element.style.top = "90px";
                addDragFunctionality(insp._element);
            }
            const newRight = isExpanded ? "600px" : "150px";

            if (lastRightPos !== newRight) {
                insp._element.style.right = newRight;
                lastRightPos = newRight;
            }
        }
        else if (insp) {
            insp.destroy();
            insp = null;
            lastRightPos = null;
        }
    }, 1000);
}

/**
 * Adds drag-and-drop functionality to the inspector element.
 * The inspector can be moved by holding the middle mouse button (mouse button 1).
 * @param {HTMLElement} element - The DOM element to be moved.
 * @returns {void}
 */
function addDragFunctionality (element) {
    let isDragging = false,
        offsetX = 0,
        offsetY = 0;

    element.addEventListener("mousedown", function (e) {
        if (e.button === 1) {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            document.body.style.userSelect = "none";
        }
    });

    document.addEventListener("mousemove", function (e) {
        if (isDragging) {
            const newX = e.clientX - offsetX,
                newY = e.clientY - offsetY;

            element.style.left = newX + "px";
            element.style.top = newY + "px";
        }
    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
        document.body.style.userSelect = "";
    });
}

/**
 * Checks if Cesium is defined and starts the function to create the 3D Tiles Inspector once Cesium is available.
 * If Cesium is not defined, it checks every second until it is defined.
 * @returns {void}
 */
function checkCesiumAndCreateInspector () {
    const checkCesiumInterval = setInterval(function () {
        if (typeof Cesium !== "undefined") {
            clearInterval(checkCesiumInterval);
            createCesium3dTilesInspector();
        }
    }, 1000);
}

checkCesiumAndCreateInspector();

export {
    createCesium3dTilesInspector
};

