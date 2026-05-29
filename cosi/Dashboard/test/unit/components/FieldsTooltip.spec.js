import Vuex from "vuex";
// import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import {mount, shallowMount} from "@vue/test-utils";
// import FieldsTooltip from "../../../components/FieldsTooltip.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
// import Vue from "vue";

// config.mocks.$t = key => key;
// Vue.use(Vuetify);

// const localVue = createLocalVue();

// localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe.skip("addons/cosi/Dashboard/components/FieldsTooltip.vue", () => {
    beforeAll(() => {
        global.ShadowRoot = () => "";
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            updateSize: () => sinon.stub()
        };

        mapCollection.addMap(map, "2D");
    });

    let store, vuetify, wrapper;

    const FieldsTooltip = undefined,
        factory = {
            getMount: (mountFn = mount) => {
                return mountFn(FieldsTooltip, {
                    propsData: {
                        fields: {"test1": "test1", "test2": "test2"}
                    },
                    store,
                    // localVue,
                    vuetify,
                    sync: false
                });
            },
            initialize: async (mountFn = mount) => {
                wrapper = factory.getMount(mountFn);
            }
        };

    beforeEach(async () => {
        vuetify = new Vuetify();
        store = new Vuex.Store({
            namespaced: true
        });
    });

    afterEach(() => {

        if (wrapper) {
            wrapper.destroy();
        }
    });

    it("should render Component", async () => {
        await factory.initialize(shallowMount);
        expect(wrapper.findAll("span")).to.have.lengthOf(2);
    });
});
