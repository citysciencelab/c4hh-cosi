import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import SelectableList from "../../../components/SelectableList.vue";

describe("addons/geoMarker/components/SelectableList.vue", () => {
    let wrapper,
        store;

    const tableData = {
        headers: [
            {
                itemProperty: "id",
                displayName: "ID",
                sortable: "numeric"
            },
            {
                itemProperty: "description",
                displayName: "Description",
                cssClass: "clamp",
                sortable: "string"
            },
            {
                itemProperty: "date",
                displayName: "Date",
                sortable: "date",
                sortableDateFormat: "YYYY-MM-DD HH:mm"
            }
        ],
        items: [
            {
                id: 2,
                description: "A Item",
                date: "2025-01-01 00:00"
            },
            {
                id: 1,
                description: "Z item",
                date: "2025-01-01 00:00"
            }
        ]
    };

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GeoMarker: {
                            namespaced: true,
                            getters: {
                                geoMarkerFeatureSelected: () => null,
                                geoMarkerShortFeatureId: () => (featureId) => featureId,
                                scrollToGeoMarkerId: () => null,
                                listScrollTop: () => 0
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(SelectableList, {
            propsData: {
                tableData
            },
            global: {
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist and have the correct id", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("SelectableList");
    });

    it("renders table headers and items", () => {
        expect(wrapper.text()).to.contain("ID");
        expect(wrapper.text()).to.contain("Description");
        expect(wrapper.text()).to.contain("Z item");
        expect(wrapper.text()).to.contain("A Item");
    });

    it("emits itemSelected when row is clicked", async () => {
        const rows = wrapper.findAll("tbody tr");

        await rows.at(1).trigger("click");

        expect(wrapper.emitted().itemSelected).to.exist;
        expect(wrapper.emitted().itemSelected[0][0]).to.deep.equal({id: 1, description: "Z item", date: "2025-01-01 00:00"});
    });

    it("reacts to selectedItemId prop", async () => {
        await wrapper.setProps({selectedItemId: null});

        expect(wrapper.vm.selectedItem).to.be.null;
    });

    it("handles highlightSelection property correctly", async () => {
        expect(wrapper.find("tr.highlightSelection").exists()).to.be.true;

        await wrapper.setProps({highlightSelection: false});

        expect(wrapper.find("tr.highlightSelection").exists()).to.be.false;
    });

    it("sorts id column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-id span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("Z item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("A Item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");
    });

    it("sorts string column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-description span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("Z item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("A Item");
    });

    it("sorts date column correctly", async () => {
        const sortButton = wrapper.find("th.th-item-date span.sortable-icon");

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-date").text()).to.equal("2025-01-01 00:00");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-date").text()).to.equal("2025-01-01 00:00");

        sortButton.trigger("click");

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-id").text()).to.equal("2");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-description").text()).to.equal("A Item");
        expect(wrapper.findAll("tbody tr")[0].find("td.td-item-date").text()).to.equal("2025-01-01 00:00");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-id").text()).to.equal("1");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-description").text()).to.equal("Z item");
        expect(wrapper.findAll("tbody tr")[1].find("td.td-item-date").text()).to.equal("2025-01-01 00:00");
    });
});
