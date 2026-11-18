import store from "@appstore/index.js";
import Map from "ol/Map.js";
import View from "ol/View.js";


/**
 * Returns a png image of a heatmap layer
 *  Creates a new map instance on a temporary hidden div and attaches only the heatmap layer
 *  locates the canvas in the current viewport and creates a screenshot
 * @param {ol.layer.Heatmap} layer - heatmap layer
 * @returns {Object} - image spec
 */
async function buildHeatmapPng (layer) {
    return new Promise((resolve, reject) => {
        const tempDiv = document.createElement("div"),
            mapSize = store.getters["Maps/size"],
            mapView = mapCollection.getMapView("2D"),
            printZoomLevel = mapView.getProperties().options.find(option => {
                const checkScale = store.state.Modules.Print.isScaleSelectedManually
                    ? store.state.Modules.Print.currentScale
                    : store.state.Modules.Print.optimalScale;

                return option.scale === checkScale;
            }),
            heatmapView = new View(mapView.getProperties()),
            pixelRatio = window.devicePixelRatio || 1;


        // OpenLayers adjusts rendering based on window.devicePixelRatio, which can cause unexpected behavior at different resolutions.
        // Set explicit canvas scaling to prevent distortion
        heatmapView.setResolution(heatmapView.getResolution() / pixelRatio);

        tempDiv.style.position = "absolute";
        tempDiv.style.top = "-9999px"; // Hide off-screen

        heatmapView.setZoom(printZoomLevel.zoomLevel);

        // If the print scale is different from the current map scale the print area may be outside of the
        // current map extent. Therefore we increase the size of the temporary map for the heatmap.
        if (store.state.Modules.Print.currentScale !== store.state.Modules.Print.currentMapScale) {
            tempDiv.style.width = (mapSize[0] % 2 === 0 ? mapSize[0] + 600 : mapSize[0] + 601) + "px";
            tempDiv.style.height = (mapSize[1] % 2 === 0 ? mapSize[1] + 600 : mapSize[1] + 601) + "px";
        }
        else {
            tempDiv.style.width = (mapSize[0] + 1000) + "px";
            tempDiv.style.height = (mapSize[1] + 1000) + "px";
        }

        document.body.appendChild(tempDiv);

        const heatmapMap = new Map({
            target: tempDiv,
            layers: [layer],
            view: heatmapView,
            renderer: "canvas"
        });

        heatmapMap.once("postrender", () => {

            setTimeout(async () => {
                try {
                    heatmapMap.renderSync();

                    const canvas = heatmapMap.getViewport().querySelector("canvas"),
                        imageUrl = await getBase64FromWebGLCanvas(canvas, heatmapMap);

                    document.body.removeChild(tempDiv);

                    resolve({
                        imageUrl,
                        heatmapExtent: heatmapView.calculateExtent()
                    });

                    heatmapMap.setTarget(null);
                    heatmapMap.dispose();
                }
                catch (error) {
                    document.body.removeChild(tempDiv);
                    reject("Error exporting heatmap: " + error.message);
                }
            }, 1000);
        });
    });
}

/**
 * Checks if a canvas with a heatmap is emtpy by checking for empty pixels
 *  Since each pixel has 4 values (R, G, B, A), the array length is 4 * width * height.
 *  index % 4 === 3 identifies the alpha channel (A) of each pixel.
 *  If index % 4 === 3 → It’s an alpha value → Check if value === 0 (fully transparent).
 *  Otherwise (index % 4 !== 3 → It’s R, G, or B) → Also check if value === 0 (black or transparent).
 * @param {WebGLRenderingContext} gl - The WebGL rendering context obtained from the canvas, useed to capture the content, e.g., gl.readPixels
 * @param {HTMLCanvasElement} canvas - The canvas element used to create the WebGL context.
 * @returns {Boolean} - Returns true if all pixels in the given canvas are empty.
 */
function isCanvasEmpty (gl, canvas) {
    const width = canvas.width,
        height = canvas.height,
        pixels = new Uint8Array(4 * width * height);

    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    return pixels.every((value, index) => index % 4 === 3 ? value === 0 : value === 0);
}

/**
 * Generates a base64 image from a given canvas
 * @param {HTMLCanvasElement} canvas - The canvas element containing the heatmap.
 * @returns {String} A Base64-encoded image string (data URL).
 */
function getBase64FromWebGLCanvas (canvas) {
    const gl = canvas.getContext("webgl");

    if (!gl) {
        console.error("WebGL not supported.");
        return null;
    }

    return new Promise((resolve) => {

        if (isCanvasEmpty(gl, canvas)) {
            resolve("empty");
        }
        else {

            const base64Image = canvas.toDataURL("image/png"); // Convert to base64 image

            resolve(base64Image);
        }

        return null;
    }).catch((err) => {
        console.error(err);
    });
}

export {
    buildHeatmapPng,
    isCanvasEmpty,
    getBase64FromWebGLCanvas
};
