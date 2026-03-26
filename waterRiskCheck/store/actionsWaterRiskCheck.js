import {nextTick} from "vue";

export default {
    /**
     * Sets the name and the coordinates of the address.
     * @param {Object} context - The store instance.
     * @param {Function} context.commit - The commit function.
     * @param {Object} payload - The payload.
     * @param {String} payload.name - The name of the address (street + housenumber).
     * @param {Number[]} payload.coordinates - The coordinates of the address.
     * @returns {void}
     */
    async updateAddress ({commit, rootGetters, dispatch, rootState}, {name, coordinates, type}) {
        if (type !== "Address") {
            commit("Modules/WaterRiskCheckSearchBar/setSearchInput", name, {root: true});
            return;
        }
        commit("setAddressCoordinates", coordinates);
        commit("setAddress", name);
        await nextTick();
        commit("Modules/WaterRiskCheckSearchBar/setSearchInput", "", {root: true});
        if (rootGetters.isMobile) {
            dispatch("Menu/navigateBack", rootState.Modules.WaterRiskCheckSearchBar.currentSide, {root: true});
        }

    }
};
