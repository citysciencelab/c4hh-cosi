import {GeoJSON} from "ol/format.js";
import GeoJSONWriter from "jsts/org/locationtech/jts/io/GeoJSONWriter.js";
import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import {BufferOp} from "jsts/org/locationtech/jts/operation/buffer";
import Feature from "ol/Feature.js";
import {Polygon} from "ol/geom.js";


export const actionsBuffer = {
    /**
    * Creates a buffer around a line geometry
    * @param {ol.geom.Geometry} geometry - The line geometry to buffer
    * @param {ol.layer.Vector} layer - The layer to add the buffered geometry to
    * @param {Boolean} triggerEvent - Whether to trigger the onDrawEnd event
    * @returns {void}
    */
    createBufferFromLine: function ({commit}, {geometry, layer, bufferDistance = 100, triggerEvent = true}) {
        try {
            let buffered = null,
                writer = null,
                bufferedGeojson = null,
                coordinates = null;

            const geojsonFormat = new GeoJSON(),
                geojson = geojsonFormat.writeGeometry(geometry),
                reader = new GeoJSONReader(),
                jstsGeom = reader.read(geojson);

            if (!jstsGeom || jstsGeom.isEmpty()) {
                throw new Error("Invalid or empty geometry");
            }

            buffered = BufferOp.bufferOp(jstsGeom, bufferDistance);
            writer = new GeoJSONWriter();
            bufferedGeojson = writer.write(buffered);


            if (bufferedGeojson.type === "MultiPolygon") {
                const outerRing = bufferedGeojson.coordinates[0][0],
                    innerRings = [];

                bufferedGeojson.coordinates.forEach((poly, index) => {
                    if (index === 0) {
                        innerRings.push(...poly.slice(1));
                    }
                    else {
                        innerRings.push(...poly);
                    }
                });
                coordinates = [outerRing, ...innerRings];
            }
            else if (bufferedGeojson.type === "Polygon") {
                coordinates = bufferedGeojson.coordinates;
            }
            else {
                throw new Error(`Unexpected geometry type: ${bufferedGeojson.type}`);
            }

            if (coordinates) {
                const polygonFeature = new Feature({
                        geometry: new Polygon(coordinates)
                    }),
                    polygonGeoJson = {
                        type: "Polygon",
                        coordinates: coordinates
                    },
                    source = layer.getSource(),
                    lineFeature = new Feature({
                        geometry: geometry.clone()
                    });

                source.clear();
                source.addFeature(lineFeature);
                source.addFeature(polygonFeature);

                if (triggerEvent) {
                    commit("setSelectedAreaGeoJson", polygonGeoJson);
                    commit("setDrawEndData", polygonGeoJson);
                }
            }
        }
        catch (error) {
            console.error("Error creating buffer:", error);
        }
    }
};
