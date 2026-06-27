import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import Feature from "ol/Feature.js";
import {Icon, Style} from "ol/style.js";
import Point from "ol/geom/Point.js";
import styleList from "@masterportal/masterportalapi/src/vectorStyle/styleList.js";

import calculateCenterOfExtent from "@shared/js/utils/calculateCenterOfExtent.js";
import {isUrl} from "@shared/js/utils/urlHelper.js";

/**
 * Creates a style for a zoom to feature.
 * @param {Feature[]} features Features, which center coordinates should be styled.
 * @param {String} styleId Id of the styleObject.
 * @param {Boolean} [centerOfExtent=true] Specifies whether the zoom should be applied to the feature itself or its extent.
 * @see {@link https://community.cesium.com/t/cors-and-billboard-image/3920/2} crossOrigin: "anonymous", is necessary for the 3D mode.
 * @returns {Feature[]} Styled features.
 */
export default function (features, styleId, centerOfExtent = true) {
    return features
        .map((feature, index) => {
            if (centerOfExtent) {
                return new Feature({
                    geometry: new Point(calculateCenterOfExtent(feature.getGeometry().getExtent())),
                    name: `featureIcon${index}`
                });
            }

            feature.set("name", `featureIcon${index}`);
            return feature;
        })
        .map(feature => {
            let style;

            if (isUrl(styleId)) {
                style = new Style({
                    image: new Icon({
                        crossOrigin: "anonymous",
                        anchor: [0.5, 24],
                        anchorXUnits: "fraction",
                        anchorYUnits: "pixels",
                        src: styleId,
                        scale: 2
                    })
                });
            }
            else {
                const styleObject = styleList.returnStyleObject(styleId);

                style = styleObject === undefined
                    ? new Style()
                    : createStyle.createStyle(styleObject, feature, false, Config.wfsImgPath);
            }

            feature.setStyle(style);
            return feature;
        });
}
