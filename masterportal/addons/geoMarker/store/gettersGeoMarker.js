import {generateSimpleGetters} from "../../../src/shared/js/utils/generators";
import stateGeoMarker from "./stateGeoMarker";

const getters = {
    ...generateSimpleGetters(stateGeoMarker),
    geoMarkerShortFeatureId: (state) => (featureId) => {
        return Number(featureId.replace(state.geoMarkerWfsFeatureIdPrefix, ""));
    },
    geoMarkerState: (state) => (geoMarker) => {
        // Collect current status fields for all departments, excluding null values.
        const departmentStatus = Object.keys(state.departments).map(departmentId => {
            const departmentStateField = state.departments[departmentId].fields.status;

            return geoMarker[departmentStateField] ?? null;
        }).filter(value => value !== null);

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

    },
    /**
     * takes the list of departments from configuration json file
     * and filters all departments without setting "no_edit = true"
     *
     * @returns {Object} all departments that may be selected in "new"- and "edit"-form
     */
    departmentsAllowNewEdit (state) {
        const filteredDepartments = Object.fromEntries(
            Object.entries(state.departments)
                // eslint-disable-next-line no-unused-vars
                .filter(([key, value]) => !value.no_edit || value.no_edit === false));

        return filteredDepartments;
    },
    /**
     * takes a given feature and checks, if it is of type GEMIS
     * GEMIS features may not be edited
     *
     * @param {Object} feature - The feature to check.
     * @returns {Boolean} true if the given feature is a GEMIS dataset, otherwise false
     */
    isGemisFeature: () => (feature) => {
        if (
            feature &&
            feature.get("sta_gemis") &&
            ["offen", "geschlossen"].includes(feature.get("sta_gemis")) &&
            feature.get("kategorie") === "GEMIS-Datensatz"
        ) {
            return true;
        }

        return false;
    }
};

export default getters;
