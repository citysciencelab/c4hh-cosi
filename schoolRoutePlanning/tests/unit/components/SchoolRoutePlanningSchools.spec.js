import Vuex from "vuex";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";

import SchoolRoutePlanningSchoolsComponent from "../../../components/SchoolRoutePlanningSchools.vue";

import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("addons/SchoolRoutePlanning/components/SchoolRoutePlanningSchools.vue", () => {
    let store,
        wrapperElements;

    beforeEach(() => {
        const feature = new Feature({
            id: "Thor",
            schul_id: "1000-0",
            schulname: "The name",
            adresse_strasse_hausnr: "Address"
        });

        feature.setGeometry(new Point(100, 200));

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        SchoolRoutePlanning: {
                            namespaced: true,
                            getters: {
                                regionalPrimarySchoolName: () => "Thor",
                                regionalPrimarySchoolNumber: () => "1000-0",
                                selectedSchoolNumber: () => "",
                                sortedSchools: () => [feature]
                            },
                            mutations: {
                                setSelectedSchoolNumber: sinon.stub()
                            },
                            actions: {
                                selectSchool: sinon.stub()
                            }
                        }
                    }
                }
            }
        });
        wrapperElements = {
            store,
            localVue,
            propsData: {
                layer: new VectorLayer({
                    source: new VectorSource({
                        feature: new Feature({
                            id: "endPoint"
                        })
                    })
                })
            }
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("renders the SchoolRoutePlanningSchoolsComponent", () => {
        const wrapper = shallowMount(SchoolRoutePlanningSchoolsComponent, wrapperElements);

        expect(wrapper.find("div.mb-3").exists()).to.be.true;
    });

    it("renders the regionalPrimarySchool", () => {
        const wrapper = shallowMount(SchoolRoutePlanningSchoolsComponent, wrapperElements);

        expect(wrapper.find("span.d-block").exists()).to.be.true;
        expect(wrapper.find("span.d-block").text()).to.include("additional:modules.tools.schoolRoutePlanning.regionalPrimarySchool");
        expect(wrapper.find("span a.d-block").text()).to.equals("Thor");
    });

    it("set selected schoolNumber", async () => {
        const spySelectSchoolNumber = sinon.spy(SchoolRoutePlanningSchoolsComponent.methods, "selectSchoolNumber"),
            wrapper = shallowMount(SchoolRoutePlanningSchoolsComponent, wrapperElements);

        await wrapper.find("a.d-block").trigger("click");

        expect(spySelectSchoolNumber.called).to.be.true;
        expect(spySelectSchoolNumber.firstCall.args[0]).to.equals("1000-0");
        expect(spySelectSchoolNumber.firstCall.args[1]).to.equals("Thor");
    });

    it("renders the schools", () => {
        const schools = [
            {
                id: "school1",
                getGeometry: () => [100, 100],
                get: (attribute) => {
                    const attributes = {
                        schul_id: "1000-0",
                        schulname: "school1",
                        adresse_strasse_hausnr: "example address 1"
                    };

                    return attributes[attribute];
                }
            },
            {
                id: "school3",
                getGeometry: () => [300, 300],
                get: (attribute) => {
                    const attributes = {
                        schul_id: "3000-0",
                        schulname: "school3",
                        adresse_strasse_hausnr: "example address 3"
                    };

                    return attributes[attribute];
                }
            },
            {
                id: "school2",
                getGeometry: () => [200, 200],
                get: (attribute) => {
                    const attributes = {
                        schul_id: "2000-0",
                        schulname: "school2",
                        adresse_strasse_hausnr: "example address 2"
                    };

                    return attributes[attribute];
                }
            }
        ];
        let wrapper = null;

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        SchoolRoutePlanning: {
                            namespaced: true,
                            getters: {
                                regionalPrimarySchoolName: () => "Thor",
                                regionalPrimarySchoolNumber: () => "1000-0",
                                selectedSchoolNumber: () => "",
                                sortedSchools: () => schools
                            },
                            mutations: {
                                setSelectedSchoolNumber: sinon.stub()
                            },
                            actions: {
                                selectSchool: sinon.stub()
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(SchoolRoutePlanningSchoolsComponent, wrapperElements);

        expect(wrapper.find(".tool-schoolRoutePlanning-schools-multiselect-container").exists()).to.be.true;
        expect(wrapper.find(".tool-schoolRoutePlanning-schools-multiselect-container .form-label").exists()).to.be.true;
        expect(wrapper.find(".tool-schoolRoutePlanning-schools-multiselect-container > multiselect-stub").exists()).to.be.true;
    });
});
