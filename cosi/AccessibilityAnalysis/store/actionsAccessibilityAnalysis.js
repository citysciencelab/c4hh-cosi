import {createIsochrones} from "../utils/createIsochrones.js";

const actions = {
    async getIsochrones ({rootGetters, getters, commit}, params) {
        let ret;

        try {
            ret = await createIsochrones({...params, batchSize: getters.batchSize, projectionCode: rootGetters["Maps/projectionCode"]}, (p) => commit("setProgress", p));
        }
        catch {
            ret = await createIsochrones({...params, batchSize: getters.batchSize, projectionCode: rootGetters["Maps/projectionCode"]}, (p) => commit("setProgress", p));
        }
        finally {
            commit("setProgress", 0);
        }
        return ret;
    }
};

export default actions;
