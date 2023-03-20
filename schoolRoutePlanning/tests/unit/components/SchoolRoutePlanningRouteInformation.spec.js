import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";

import SchoolRoutePlanningRouteInformation from "../../../components/SchoolRoutePlanningRouteInformation.vue";
import SchoolRoutePlanning from "../../../store/indexSchoolRoutePlanning";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/SchoolRoutePlanning/components/SchoolRoutePlanningRouteInformation.vue", () => {
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
                        SchoolRoutePlanning
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            }
        });
        wrapperElements = {
            store,
            localVue
        };
    });

    it("do not renders the SchoolRoutePlanningRouteInformation", () => {
        const wrapper = shallowMount(SchoolRoutePlanningRouteInformation, wrapperElements);

        expect(wrapper.find(".route-information-container").exists()).to.be.false;
    });

    it("renders the SchoolRoutePlanningRouteInformation", () => {
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setRouteDescription", ["Ruffy", "Zorro"]);
        store.commit("Tools/SchoolRoutePlanning/setSelectedSchool", {get: () => "Lysop"});
        wrapper = shallowMount(SchoolRoutePlanningRouteInformation, wrapperElements);

        expect(wrapper.find(".route-information-container").exists()).to.be.true;
    });

    it("renders the p tags", () => {
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setRouteDescription", ["Ruffy", "Zorro"]);
        store.commit("Tools/SchoolRoutePlanning/setSelectedSchool", {get: () => "Lysop"});
        store.commit("Tools/SchoolRoutePlanning/setSelectedAddress", "Nami");
        store.commit("Tools/SchoolRoutePlanning/setRouteLength", "2000m");
        store.commit("Tools/SchoolRoutePlanning/setRouteElements", {
            SchuleingangTyp: "Sanji",
            SchuleingangAdresse: "Chopper"
        });
        wrapper = shallowMount(SchoolRoutePlanningRouteInformation, wrapperElements);

        expect(wrapper.findAll("p").wrappers.length).to.equals(3);
        expect(wrapper.findAll("p").at(0).find("span").text()).to.equals("2000m");
        expect(wrapper.findAll("p").at(1).text()).to.include("additional:modules.tools.schoolRoutePlanning.from");
        expect(wrapper.findAll("p").at(1).find("span").text()).to.equals("Nami");
        expect(wrapper.findAll("p").at(2).text()).to.include("additional:modules.tools.schoolRoutePlanning.to");
        expect(wrapper.findAll("p").at(2).find("span").text()).to.equals("Lysop, Sanji (Chopper)");
    });

    it("Renders the route description with button and list", () => {
        let wrapper = null;

        store.commit("Tools/SchoolRoutePlanning/setRouteDescription", [{anweisung: "Ruffy"}, {anweisung: "Zorro"}]);
        store.commit("Tools/SchoolRoutePlanning/setSelectedSchool", {get: () => "Lysop"});
        wrapper = shallowMount(SchoolRoutePlanningRouteInformation, wrapperElements);

        expect(wrapper.find("#tool-schoolRoutePlanning-route-description").exists()).to.be.true;
        expect(wrapper.find("button").exists()).to.be.true;
        expect(wrapper.find("ol").exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.equals(2);
        expect(wrapper.findAll("li").at(0).text()).to.equals("Ruffy");
        expect(wrapper.findAll("li").at(1).text()).to.equals("Zorro");
    });
});
