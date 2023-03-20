import Vuex from "vuex";
import {
    config,
    mount,
    createLocalVue
} from "@vue/test-utils";
import DetailView from "../../../components/DetailView.vue";
import chai from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

Vue.use(Vuetify);

const localVue = createLocalVue(),
    expect = chai.expect;

localVue.use(Vuex);

config.mocks.$t = key => key;

// eslint-disable-next-line require-jsdoc
function createFeature (key) {
    const feature = new Feature({
        id: "id",
        schulname: "feature 1",
        anzahl_schueler: 42,
        adresse_strasse_hausnr: "Hauptstraße",
        adresse_ort: "Hamburg",
        kapitelbezeichnung: "Grundschule",
        geometry: new Point([
            10.086822509765625,
            53.55825752009741
        ])
    });

    feature.setId("id");
    if (key) {
        feature.key = key;
    }
    return feature;
}

describe("addons/cosi/FeaturesList/components/DetailView.vue", () => {
    let vuetify;

    beforeEach(() => {
        vuetify = new Vuetify();
    });

    // eslint-disable-next-line require-jsdoc, no-shadow
    function mountComponent () {
        const ret = mount(DetailView, {
            propsData: {
                item: {
                    feature: createFeature(),
                    layerId: "123",
                    gfiAttributes: {
                        id: "id",
                        schulname: "feature 1",
                        anzahl_schueler: 42,
                        adresse_strasse_hausnr: "Hauptstraße",
                        adresse_ort: "Hamburg",
                        kapitelbezeichnung: "Grundschule",
                        geometry: new Point([
                            10.086822509765625,
                            53.55825752009741
                        ])
                    }
                },
                filterProps: {},
                propBlacklist: ["geometry"]
            },
            localVue,
            vuetify
        });

        return ret;
    }

    describe("Component DOM", () => {
        it("should have six table rows", () => {
            const wrapper = mountComponent();

            expect(wrapper.findAll("tr")).to.have.lengthOf(6);
            wrapper.destroy();
        });
    });
    describe("User Interactions", () => {
        it("should call updateFilterProps if checkox is selected", async () => {
            const spyUpdateFilterProps = sinon.spy(DetailView.methods, "updateFilterProps"),
                wrapper = mountComponent(),
                checkboxWrapper = wrapper.findComponent({name: "v-checkbox"});

            expect(checkboxWrapper.exists()).to.be.true;
            await checkboxWrapper.trigger("change");
            expect(spyUpdateFilterProps.calledOnce).to.be.true;
        });
    });
});
