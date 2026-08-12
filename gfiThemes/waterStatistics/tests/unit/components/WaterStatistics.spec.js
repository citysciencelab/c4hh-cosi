import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import WaterStatistics from "../../../components/WaterStatistics.vue";

describe("addons/gfiThemes/waterStatistics/components/WaterStatistics.vue", () => {
    let store, wrapper;

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        WaterStatistics: {
                            namespaced: true,
                            actions: {
                                queryOaf: sinon.spy(),
                                queryOafSchema: sinon.spy()
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(WaterStatistics, {
            global: {
                plugins: [store]
            },
            props: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    },
                    getTheme: function () {
                        return {
                            params: {
                                themeTabs: []
                            }
                        };
                    },
                    getAttributesToShow: function () {
                        return {
                        };
                    },
                    getProperties: function () {
                        return {
                        };
                    }
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should render the WaterStatistics theme", () => {
        expect(wrapper.find(".water-statistics-theme").exists()).to.be.true;
    });
});

