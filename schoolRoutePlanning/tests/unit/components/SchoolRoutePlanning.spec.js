import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SchoolRoutePlanningComponent from "../../../components/SchoolRoutePlanning.vue";
import SchoolRoutePlanning from "../../../store/indexSchoolRoutePlanning";
import Address from "../../../components/SchoolRoutePlanningAddress.vue";
import RouteInformation from "../../../components/SchoolRoutePlanningRouteInformation.vue";
import Schools from "../../../components/SchoolRoutePlanningSchools.vue";
import ToggleCheckbox from "../../../../../src/share-components/toggleCheckbox/components/ToggleCheckbox.vue";
import Print from "../../../../../src/modules/tools/print/store/indexPrint";

import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/SchoolRoutePlanning/components/SchoolRoutePlanning.vue", () => {
    const mockConfigJson = {
        Portalconfig: {
            menu: {
                SchoolRoutePlanning: {
                    "name": "translate#additional:modules.tools.schoolRoutePlanning.title",
                    "icon": "bi-list-columns-reverse"
                }
            }
        }
    };
    let store,
        wrapperElements;

    beforeEach(() => {
        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        SchoolRoutePlanning,
                        Print
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                getRestServiceById: () => sinon.stub()
            }
        });
        store.commit("Tools/SchoolRoutePlanning/setActive", true);
        wrapperElements = {
            store,
            localVue,
            data () {
                return {
                    layer: new VectorLayer({
                        source: new VectorSource()
                    })
                };
            }
        };
    });

    it("renders the SchoolRoutePlanning", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.find(".content-school-route-planning").exists()).to.be.true;
    });

    it("do not render the SchoolRoutePlanning if not active", () => {
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setActive", false);
        wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.find(".content-school-route-planning").exists()).to.be.false;
    });

    it("Render the input with no value", () => {
        const wrapper = shallowMount(Address, wrapperElements);

        expect(wrapper.find("#tool-schoolRoutePlanning-search-address").element.value).to.equals("");
    });

    it("Set the input field to the value of inputaddress via data binding", async () => {
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setInputAddress", "abc");
        wrapper = shallowMount(Address, wrapperElements);
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#tool-schoolRoutePlanning-search-address").element.value).to.equals("abc");
        store.commit("Tools/SchoolRoutePlanning/setInputAddress", "");
    });

    it("render the addressList", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findComponent(Address).exists()).to.be.true;
    });

    it("render the Schools", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findComponent(Schools).exists()).to.be.true;
    });

    it("render the Schools", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findComponent(Schools).exists()).to.be.true;
    });

    it("render routing checkbox container", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.find(".form-label").exists()).to.be.true;
        expect(wrapper.find(".form-label").text()).to.equals("additional:modules.tools.schoolRoutePlanning.transportNetwork");
    });

    it("render the ToggleCheckbox", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findComponent(ToggleCheckbox).exists()).to.be.true;
    });


    it("render the button group those disabled by default", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findAll("button").at(0).text()).to.equals("additional:modules.tools.schoolRoutePlanning.printRouteName");
        expect(wrapper.findAll("button").at(0).classes()).to.include("btn", "btn-primary", "btn-sm", "mr-3");
        expect(wrapper.findAll("button").at(0).attributes("disabled")).to.equals("disabled");

        expect(wrapper.findAll("button").at(1).text()).to.equals("additional:modules.tools.schoolRoutePlanning.deleteRoute");
        expect(wrapper.findAll("button").at(1).classes()).to.include("btn", "btn-secondary", "btn-sm");
        expect(wrapper.findAll("button").at(1).attributes("disabled")).to.equals("disabled");
    });

    it("click first button and start the action printRoute", async () => {
        const spyPrintRoute = sinon.spy(SchoolRoutePlanningComponent.methods, "printRoute");
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setRouteElements", ["Dagobert", "Duck"]);
        store.commit("Tools/SchoolRoutePlanning/setInputAddress", "Donald Duck");
        store.commit("Tools/SchoolRoutePlanning/setSelectedSchool", {get: () => "abc"});
        wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        await wrapper.findAll("button").at(0).trigger("click");

        expect(spyPrintRoute.calledOnce).to.be.true;
    });

    it("click second button and start the action resetLayerUserInterface", async () => {
        const spyResetLayerUserInterface = sinon.spy(SchoolRoutePlanningComponent.methods, "resetLayerUserInterface"),
            wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        await wrapper.findAll("button").at(1).trigger("click");

        expect(spyResetLayerUserInterface.calledOnce).to.be.true;
    });

    it("render the RouteInformation", () => {
        const wrapper = shallowMount(SchoolRoutePlanningComponent, wrapperElements);

        expect(wrapper.findComponent(RouteInformation).exists()).to.be.true;
    });
});
