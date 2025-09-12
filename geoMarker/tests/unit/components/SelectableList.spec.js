import {expect} from "chai";
import {shallowMount} from "@vue/test-utils";
import SelectableList from "../../../components/SelectableList.vue";

describe("addons/geoMarker/components/SelectableList.vue", () => {
    const tableData = {
        headers: [
            {
                itemProperty: "id",
                displayName: "ID"
            },
            {
                itemProperty: "description",
                displayName: "Description",
                cssClass: "clamp"
            }
        ],
        items: [
            {
                id: 1,
                description: "First item"
            },
            {
                id: 2,
                description: "Second item"
            }
        ]
    };

    it("should exist and have the correct id", () => {
        const wrapper = shallowMount(SelectableList, {
            propsData: {tableData}
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes("id")).to.be.equal("SelectableList");
    });

    it("renders table headers and items", () => {
        const wrapper = shallowMount(SelectableList, {
            propsData: {tableData}
        });

        expect(wrapper.text()).to.contain("ID");
        expect(wrapper.text()).to.contain("Description");
        expect(wrapper.text()).to.contain("First item");
        expect(wrapper.text()).to.contain("Second item");
    });

    it("emits itemSelected when row is clicked", async () => {
        const wrapper = shallowMount(SelectableList, {
                propsData: {tableData}
            }),
            rows = wrapper.findAll("tbody tr");

        await rows.at(1).trigger("click");

        expect(wrapper.emitted().itemSelected).to.exist;
        expect(wrapper.emitted().itemSelected[0][0]).to.deep.equal({id: 2, description: "Second item"});
    });

    it("reacts to selectedItemId prop", async () => {
        const wrapper = shallowMount(SelectableList, {
            propsData: {tableData, selectedItemId: 1}
        });

        await wrapper.setProps({selectedItemId: null});

        expect(wrapper.vm.selectedItem).to.be.null;
    });
});
