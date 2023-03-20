import {generateSimpleMutations} from "../../../src/app-store/utils/generators";
import stateSchoolRoutePlanning from "./stateSchoolRoutePlanning";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateSchoolRoutePlanning),

    /**
     * Sets the number and name of the regional primary school.
     * @param {Object} state The state of school route planning.
     * @param {String} regionalPrimarySchoolNumber The number of the regional primary school.
     * @returns {void}
     */
    setRegionalPrimarySchool (state, regionalPrimarySchoolNumber) {
        const regionalPrimarySchoolName = state.schools.find(school => school.get("schul_id") === regionalPrimarySchoolNumber);

        state.regionalPrimarySchoolNumber = regionalPrimarySchoolNumber;

        if (regionalPrimarySchoolName) {
            state.regionalPrimarySchoolName = `${regionalPrimarySchoolName.get("schulname")}, ${regionalPrimarySchoolName.get("adresse_strasse_hausnr")}`;
        }
        else {
            state.regionalPrimarySchoolName = "additional:modules.tools.schoolRoutePlanning.noSchoolFound";
        }
    },

    /**
     * Resets the state elements for school, route and address.
     * @param {Object} state The state of school route planning.
     * @returns {void}
     */
    resetStateElements (state) {
        state.inputAddress = "";
        state.streetNames = [];
        state.houseNumbers = [];
        state.filteredHouseNumbers = [];

        state.regionalPrimarySchoolNumber = null;
        state.regionalPrimarySchoolName = null;
        state.selectedSchool = null;
        state.selectedSchoolNumber = "";
        state.selectedAddress = "";

        state.routeDescription = [];
        state.routeElements = {};
        state.routeGeometry = null;
        state.routeLength = null;
    },

    /**
     * Sets the route description as a numbered list.
     * @param {Object} state The state of school route planning.
     * @param {Object[]} routeDescription The route description.
     * @returns {void}
     */
    setRouteDescription (state, routeDescription) {
        const data = [];

        routeDescription.forEach((route, index) => {
            data.push([String(index + 1), route.anweisung]);
        });

        state.routeDescription = data;
    }
};

export default mutations;
