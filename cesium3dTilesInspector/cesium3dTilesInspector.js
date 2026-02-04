import store from "../../src/app-store/index.js";

let insp = null,
    lastRightPos = null;

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
 * Updates the inspector's position based on the secondary menu state.
 * @returns {void}
 */
function updateInspectorPosition () {
    if (insp) {
        const isExpanded = store.getters["Menu/secondaryMenu"].expanded,
            newRight = isExpanded ? "600px" : "150px";

        if (lastRightPos !== newRight) {
            insp._element.style.right = newRight;
            lastRightPos = newRight;
        }
    }
}

/**
 * Waits for Cesium to be available on the global scope.
 * @returns {Promise<void>}
 */
function waitForCesium () {
    return new Promise(resolve => {
        if (typeof Cesium !== "undefined") {
            resolve();
        }
        else {
            const check = setInterval(() => {
                if (typeof Cesium !== "undefined") {
                    clearInterval(check);
                    resolve();
                }
            }, 200);
        }
    });
}

/**
 * Initializes the 3D Tiles Inspector.
 * @returns {void}
 */
function createCesium3dTilesInspector () {
    const head = document.getElementsByTagName("head")[0],
        link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "https://geofos.fhhnet.stadt.hamburg.de/mastercode/cesium/latest/Widgets/widgets.css";
    link.media = "all";
    head.appendChild(link);

    store.watch(
        () => store.getters["Maps/mode"],
        (mode) => {
            if (mode === "3D" && !insp) {
                const map3D = mapCollection.getMap("3D");

                if (!map3D || typeof map3D.getCesiumScene !== "function") {
                    console.warn("3D map is not ready yet. Inspector not created.");
                    return;
                }

                insp = new Cesium.Cesium3DTilesInspector(document.getElementById("map"), map3D.getCesiumScene());
                insp._element.style.position = "fixed";
                insp._element.style.top = "90px";
                addDragFunctionality(insp._element);
                updateInspectorPosition();
            }
            else if (mode !== "3D" && insp) {
                insp.destroy();
                insp = null;
                lastRightPos = null;
            }
        },
        {immediate: true}
    );

    store.watch(
        () => store.getters["Menu/secondaryMenu"].expanded,
        () => updateInspectorPosition()
    );
}

waitForCesium().then(createCesium3dTilesInspector);
