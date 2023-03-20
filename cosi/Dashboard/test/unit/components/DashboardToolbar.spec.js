import Vuex from "vuex";
import {config, mount, shallowMount, createLocalVue} from "@vue/test-utils";
import DashboardStore from "../../../store/indexDashboard";
import DashboardToolbar from "../../../components/DashboardToolbar.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuetify from "vuetify";
import Vue from "vue";
import mapping from "./mock.mapping.json";

config.mocks.$t = key => key;
Vue.use(Vuetify);

const localVue = createLocalVue();

localVue.use(Vuex);

global.requestAnimationFrame = (fn) => fn();

describe("addons/cosi/Dashboard/components/DashboardToolbar.vue", () => {
    before(() => {
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

    const factory = {
        getMount: (mountFn = mount) => {
            return mountFn(DashboardToolbar, {
                propsData: {
                    statsFeatureFilter: [1, 2, 3]
                },
                store,
                localVue,
                vuetify,
                sync: false
            });
        },
        initialize: async (mountFn = mount) => {
            wrapper = factory.getMount(mountFn);
            await wrapper.vm.$nextTick();
            store.commit("Tools/DistrictSelector/setLoadend", true);
            await wrapper.vm.$nextTick();
        }
    };

    beforeEach(async () => {
        vuetify = new Vuetify();
        store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        Dashboard: DashboardStore,
                        DistrictSelector: {
                            namespaced: true,
                            state: {
                                loadend: false
                            },
                            getters: {
                                mapping: () => mapping,
                                loadend: s => s.loadend,
                                metadataUrls: () => []
                            },
                            mutations: {
                                setLoadend (s, p) {
                                    s.loadend = p;
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper) {
            wrapper.destroy();
        }
    });

    it("should render Component", async () => {
        await factory.initialize(shallowMount);
        expect(wrapper.find("#dashboard-toolbar").exists()).to.be.true;
        expect(wrapper.find("#export-details").exists()).to.be.true;
        expect(wrapper.findComponent({name: "v-col"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "v-autocomplete"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "v-checkbox"}).exists()).to.be.true;
        expect(wrapper.findComponent({name: "v-btn"}).exists()).to.be.true;
    });

    it("should compute several parameter", async () => {
        await factory.initialize(shallowMount);
        expect(wrapper.vm.statsFeatureFilter).to.have.lengthOf(3);
        expect(wrapper.vm.statsMapping).to.have.lengthOf(6);
        expect(wrapper.vm.exportTimeline).to.be.false;
    });

    it("should change data value", async () => {
        await factory.initialize(mount);
        const inputCheckbox = wrapper.findComponent({name: "v-checkbox"}).find(".v-input--selection-controls__ripple");

        expect(inputCheckbox.exists()).to.be.true;
        await inputCheckbox.trigger("click");
        expect(wrapper.vm.exportTimeline).to.be.true;
    });

    it("should emit some function", async () => {
        await factory.initialize(mount);
        const button = wrapper.findComponent({name: "v-btn"}).find(".v-btn");

        expect(button.exists()).to.be.true;
        await button.trigger("click");
        expect(wrapper.emitted("exportTable")).to.be.an("array").and.to.have.lengthOf(1);
        expect(wrapper.emitted("exportTable")[0]).to.be.an("array").and.to.have.lengthOf(1);
        expect(wrapper.emitted("exportTable")[0][0]).to.be.false;
    });
});
