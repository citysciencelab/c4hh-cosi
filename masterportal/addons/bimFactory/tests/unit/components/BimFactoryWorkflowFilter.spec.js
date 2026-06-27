import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import BimFactoryWorkflowFilter from "../../../components/BimFactoryWorkflowFilter.vue";
import BimFactory from "../../../store/indexBimFactory.js";
import TableComponent from "../../../../../src/shared/modules/table/components/TableComponent.vue";

config.global.mocks.$t = key => key;

describe("addons/bimFactory/components/BimFactoryWorkflowFilter.vue", () => {
    const mockConfig = {
            component: {
                type: "BimFactoryWorkflowFilter",
                title: "Bäume filtern",
                endpoints: "https://some/endpoint",
                renderAs: "table"
            }
        },
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    getters: {
                        mode: () => {
                            return "2D";
                        }
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        BimFactory,
                        GraphicalSelect: {
                            namespaced: true,
                            getters: {
                                selectedAreaGeoJson: () => {
                                    return {coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]};
                                }
                            }
                        }
                    }
                }
            }
        });


    it("the filter component should exist", async () => {
        const wrapper = shallowMount(BimFactoryWorkflowFilter, {
            global: {
                plugins: [store]
            },
            props: {
                config: mockConfig,
                isOpen: true
            }
        });

        expect(wrapper.exists()).to.be.true;
    });

    it("renders a table when renderAs is 'table'", async () => {
        const wrapper = shallowMount(BimFactoryWorkflowFilter, {
            global: {
                plugins: [store]
            },
            propsData: {
                config: mockConfig,
                isOpen: true
            }
        });

        let tableComponent = wrapper.findComponent(TableComponent);

        expect(tableComponent.exists()).to.be.false;

        await wrapper.setData({data: {
            headers: [
                {name: "name", order: "origin", index: 0},
                {name: "value", order: "origin", index: 1}
            ],
            items: [
                {name: "Feature1", value: "Value1"},
                {name: "Feature2", value: "Value2"}
            ]
        }});

        tableComponent = wrapper.findComponent(TableComponent);

        const tableData = tableComponent.props("data");

        expect(tableComponent.exists()).to.be.true;
        expect(tableData.headers).to.have.lengthOf(2);
        expect(tableData.items).to.have.lengthOf(2);
    });

    it("renders a list when renderAs is 'list'", async () => {
        const wrapper = shallowMount(BimFactoryWorkflowFilter, {
            global: {
                plugins: [store]
            },
            propsData: {
                config: {
                    component: {
                        endpoint: "test-endpoint",
                        renderAs: "list",
                        title: "test title"
                    }
                },
                isOpen: true
            }
        });

        expect(wrapper.find("ul.responseList").exists()).to.be.false;

        await wrapper.setData({data: ["Item 1", "Item 2"]});

        expect(wrapper.find("ul.responseList").exists()).to.be.true;
        expect(wrapper.findAll("li").length).to.equal(2);
    });

    it("renders nothing if renderAs is neither 'list' nor table", async () => {
        const wrapper = shallowMount(BimFactoryWorkflowFilter, {
            global: {
                plugins: [store]
            },
            propsData: {
                config: {
                    component: {
                        endpoint: "test-endpoint",
                        renderAs: "something",
                        title: "test title"
                    }
                },
                isOpen: true
            }
        });

        await wrapper.setData({data: ["Item 1", "Item 2"]});

        expect(wrapper.find("ul.responseList").exists()).to.be.false;

        const tableComponent = wrapper.findComponent(TableComponent);

        expect(tableComponent.exists()).to.be.false;
    });
});

