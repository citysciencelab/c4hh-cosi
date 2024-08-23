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
    setAddress ({commit}, {name, coordinates}) {
        commit("setAddressCoordinates", coordinates);
        commit("setAddress", name);
    }
};
