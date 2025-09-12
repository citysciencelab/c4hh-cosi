import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import stateGeoMarker from "./stateGeoMarker";

const getters = {
    ...generateSimpleGetters(stateGeoMarker),
    geoMarkerShortFeatureId: (state) => (featureId) => {
        return Number(featureId.replace(state.geoMarkerWfsFeatureIdPrefix, ""));
    },
    geoMarkerState: (state) => (geoMarker) => {
        const category = Object.values(state.categories).find(item => item.name === geoMarker.kategorie);

        if (!category) {
            return null;
        }

        // eslint-disable-next-line one-var
        const departmentStatus = category.departments.map(department => {
            const departmentStateField = state.departments[department].fields.status;

            return geoMarker[departmentStateField] ?? "offen";
        });

        // open
        if (departmentStatus.includes("offen")) {
            return "offen";
        }

        // closed
        if (departmentStatus.every(value => value === "geschlossen")) {
            return "geschlossen";
        }

        // inactive
        if (departmentStatus.includes("inaktiv")) {
            return "inaktiv";
        }

        return "offen";

    }
};

export default getters;
