import {expect} from "chai";
import mutations from "../../../store/mutationsRefugeeHomes";
import getters from "../../../store/gettersRefugeeHomes";
import Vuex from "vuex";
import {createLocalVue} from "@vue/test-utils";

describe("ADDONS: addons/refugeeHomes/store/mutationsRefugeeHomes", () => {

    let store;

    const testFeature = {bezirk: "Altona", bezeichnung: "123", strasse: "musterstr", stadtteil: "5", platzzahl: 130},
        localVue = createLocalVue();

    localVue.use(Vuex);

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            state: {
                features: [],
                filteredFeatures: []
            }
        });
    });

    it("Adds feature to the feature array", function () {
        mutations.addFeature(store.state, testFeature);

        expect(getters.features(store.state)[0]).to.equal(testFeature);
    });
    it("Adds feature to the filterFeature array", function () {
        mutations.addFilteredFeature(store.state, testFeature);

        expect(getters.filteredFeatures(store.state)[0]).to.equal(testFeature);
    });
});
