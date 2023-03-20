import store from "../../src/app-store";
import {getWmsFeaturesByMimeType} from "../../src/api/gfi/getWmsFeaturesByMimeType";

Radio.channel("GFI").on({
    "layerAtPosition": async function (layerId, attributes) {
        store.commit("Tools/Gfi/setGfiFeatures", null);

        const coordinate = attributes.coordinate,
            layerList = mapCollection.getMap("2D").getLayers().getArray(),
            resolution = store.getters["Maps/resolution"],
            projection = store.getters["Maps/projection"],
            foundLayer = layerList.find(function (layer) {
                return layer.get("id") === layerId;
            }),
            gfiParams = {
                INFO_FORMAT: foundLayer.get("infoFormat"),
                FEATURE_COUNT: foundLayer.get("featureCount")
            },
            url = foundLayer.getSource().getFeatureInfoUrl(coordinate, resolution, projection, gfiParams),
            features = await getWmsFeaturesByMimeType(foundLayer, url),
            targetFeature = features.find(feature => {
                const properties = feature.getProperties();

                return properties.gemarkung === attributes.gemarkung &&
                    properties.flurstueck.replaceAll(" ", "") === attributes.flurstuecksnummer;
            });

        store.commit("Tools/Gfi/setActive", true);
        store.commit("Maps/setClickCoordinate", [coordinate[0], coordinate[1]]);
        store.commit("Tools/Gfi/setGfiFeatures", [targetFeature]);
    }
});
