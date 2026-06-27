import {createIsochrones} from "../utils/createIsochrones.js";

const actions = {
    async getIsochrones ({rootGetters, getters}, params) {
        let ret;

        try {
            ret = await createIsochrones({...params, batchSize: getters.batchSize, projectionCode: rootGetters["Maps/projectionCode"]});
        }
        catch {
            ret = await createIsochrones({...params, batchSize: getters.batchSize, projectionCode: rootGetters["Maps/projectionCode"]});
        }
        finally {
            console.warn("Isochrone request finished");
        }
        return ret;
    }
};

export default actions;
