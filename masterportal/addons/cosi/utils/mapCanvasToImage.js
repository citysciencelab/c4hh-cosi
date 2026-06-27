import {download} from "./download";

/**
 * converts the main OL map to an image (dataURL or Blob)
 * @async
 * @param {Boolean} [toBlob=false] export format
 * @return {Promise<String | Blob>} a promise resolving to the dataURL or Blob
 */
export default async function mapCanvasToImage (toBlob = false) {
    return new Promise(res => {
        const map = mapCollection.getMap("2D");

        map.once("rendercomplete", function () {
            let mapContext = null;
            const
                mapCanvas = document.createElement("canvas"),
                size = map.getSize();

            mapCanvas.width = size[0];
            mapCanvas.height = size[1];
            mapContext = mapCanvas.getContext("2d");

            Array.prototype.forEach.call(
                map.getViewport().querySelectorAll(".ol-layer canvas"),
                canvas => {
                    if (canvas.width > 0) {
                        let matrix;
                        const
                            opacity = canvas.parentNode.style.opacity || canvas.style.opacity,
                            transform = canvas.style.transform,
                            backgroundColor = canvas.parentNode.style.backgroundColor;

                        mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);

                        if (transform) {
                            // Get the transform parameters from the style's transform matrix
                            matrix = transform
                                .match(/^matrix\(([^(]*)\)$/)[1]
                                .split(",")
                                .map(Number);
                        }
                        else {
                            matrix = [
                                parseFloat(canvas.style.width) / canvas.width,
                                0,
                                0,
                                parseFloat(canvas.style.height) / canvas.height,
                                0,
                                0
                            ];
                        }
                        // Apply the transform to the export map context
                        CanvasRenderingContext2D.prototype.setTransform.apply(
                            mapContext,
                            matrix
                        );

                        if (backgroundColor) {
                            mapContext.fillStyle = backgroundColor;
                            mapContext.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        mapContext.drawImage(canvas, 0, 0);
                    }
                }
            );
            mapContext.globalAlpha = 1;
            mapContext.setTransform(1, 0, 0, 1, 0, 0);
            // res(toBlob ? mapCanvas.toBlob() : mapCanvas.toDataURL());
            res(toBlob ? mapCanvas.toBlob() : mapCanvas.toDataURL(), {useCORS: true, allowTaint: true});
        });
        map.renderSync();
    });
}

/**
 * Exports the current map view as image file for download
 * @async
 * @param {String} filename - the filename
 * @param {String} filetype - the filetype of the image
 * @return {void}
 */
export async function exportMapView (filename = "COSI_Kartenansicht", filetype = "png") {
    const img = await mapCanvasToImage();

    download(img, `${filename}.${filetype}`);
}
