import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {h} from "vue";
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";

describe("src/shared/modules/dropdown/components/DropdownAutocomplete.vue", () => {
    const items = ["Hamburg", "Bremen", "Berlin"],
        // the default stub renders vuetify's "prefix" prop as a read-only DOM attribute
        VAutocompleteStub = {
            name: "VAutocomplete",
            props: ["items", "modelValue"],
            emits: ["update:modelValue"],
            render () {
                return h(
                    "div",
                    Object.keys(this.$slots).map(name => h(
                        "div",
                        {"data-slot": name},
                        this.$slots[name](name === "prepend-item" ? undefined : {props: {}, foo: "bar"})
                    ))
                );
            }
        };

    /**
     * Mounts the component with the given props and slots.
     * @param {Object} props the props to pass
     * @param {Object} slots the slots to pass
     * @returns {Object} the mounted wrapper
     */
    function mountComponent (props = {}, slots = {}) {
        return shallowMount(DropdownAutocomplete, {
            props: {label: "Label", ...props},
            slots,
            global: {
                stubs: {VAutocomplete: VAutocompleteStub}
            }
        });
    }

    describe("items", () => {
        it("passes all items to the autocomplete", () => {
            const wrapper = mountComponent({items}),
                autocomplete = wrapper.findComponent({name: "VAutocomplete"});

            expect(autocomplete.exists()).to.be.true;
            expect(autocomplete.props("items")).to.have.lengthOf(3);
        });

        it("passes an empty list if no items are given", () => {
            const wrapper = mountComponent({items: []}),
                autocomplete = wrapper.findComponent({name: "VAutocomplete"});

            expect(autocomplete.props("items")).to.have.lengthOf(0);
        });
    });

    describe("update:modelValue", () => {
        it("emits update:modelValue with the selected value", async () => {
            const wrapper = mountComponent({items});

            await wrapper.findComponent({name: "VAutocomplete"}).vm.$emit("update:modelValue", "Bremen");

            expect(wrapper.emitted("update:modelValue")).to.deep.equal([["Bremen"]]);
        });

        it("emits update:modelValue with an array if multiple is set", async () => {
            const wrapper = mountComponent({items, multiple: true});

            await wrapper.findComponent({name: "VAutocomplete"}).vm.$emit("update:modelValue", ["Hamburg", "Berlin"]);

            expect(wrapper.emitted("update:modelValue")).to.deep.equal([[["Hamburg", "Berlin"]]]);
        });

        it("does not emit update:modelValue without interaction", () => {
            const wrapper = mountComponent({items});

            expect(wrapper.emitted("update:modelValue")).to.be.undefined;
        });
    });

    describe("sortable", () => {
        const objectItems = [
            {value: "hh", title: "Hamburg"},
            {value: "all", title: "All", pinned: true},
            {value: "b", title: "Berlin"},
            {value: "hb", title: "Bremen"}
        ];

        it("passes items and model value unchanged if sortable is false", () => {
            const wrapper = mountComponent({items, multiple: true, modelValue: ["Hamburg", "Berlin"]}),
                dropdown = wrapper.findComponent({name: "VAutocomplete"});

            expect(dropdown.props("items")).to.deep.equal(items);
            expect(dropdown.props("modelValue")).to.deep.equal(["Hamburg", "Berlin"]);
        });

        it("passes the items sorted alphabetically with pinned items first", () => {
            const wrapper = mountComponent({items: objectItems, sortable: true});

            expect(wrapper.findComponent({name: "VAutocomplete"}).props("items").map(item => item.value)).to.deep.equal(["all", "b", "hb", "hh"]);
        });

        it("passes the selected items first if selectedFirst is set", () => {
            const wrapper = mountComponent({items: objectItems, sortable: true, selectedFirst: true, multiple: true, modelValue: ["hh"]});

            expect(wrapper.findComponent({name: "VAutocomplete"}).props("items").map(item => item.value)).to.deep.equal(["hh", "all", "b", "hb"]);
        });

        it("passes the selected values sorted for the chips in mode multiple", () => {
            const wrapper = mountComponent({items, sortable: true, multiple: true, modelValue: ["Hamburg", "Berlin"]});

            expect(wrapper.findComponent({name: "VAutocomplete"}).props("modelValue")).to.deep.equal(["Berlin", "Hamburg"]);
        });

        it("passes the model value unchanged if it is not an array", () => {
            [undefined, null, "", "Hamburg"].forEach(modelValue => {
                const wrapper = mountComponent({items, sortable: true, modelValue});

                expect(wrapper.findComponent({name: "VAutocomplete"}).props("modelValue")).to.equal(modelValue);
            });
        });
    });

    describe("forwardedSlotNames", () => {
        it("returns the names of slots the component does not render itself", () => {
            const wrapper = mountComponent({items}, {append: "<span>a</span>"});

            expect(wrapper.vm.forwardedSlotNames).to.deep.equal(["append"]);
        });

        it("does not return chip, subheader and prepend-item", () => {
            const wrapper = mountComponent({items}, {
                chip: "<span>a</span>", subheader: "<span>b</span>", "prepend-item": "<span>c</span>"
            });

            expect(wrapper.vm.forwardedSlotNames).to.deep.equal([]);
        });

        it("returns an empty array if no slots are given", () => {
            const wrapper = mountComponent({items});

            expect(wrapper.vm.forwardedSlotNames).to.deep.equal([]);
        });
    });

    describe("slot forwarding", () => {
        it("forwards a slot the component does not handle itself (append)", () => {
            const wrapper = mountComponent({items}, {
                append: "<template #append=\"{foo}\"><span class=\"custom\">{{ foo }}</span></template>"
            });

            expect(wrapper.find("[data-slot='append'] .custom").text()).to.equal("bar");
        });

        it("renders the custom chip slot instead of the default chip", () => {
            const wrapper = mountComponent({items}, {
                chip: "<template #chip=\"{foo}\"><span class=\"custom\">{{ foo }}</span></template>"
            });

            expect(wrapper.find("[data-slot='chip'] .custom").text()).to.equal("bar");
        });

        it("renders the default slots for multiple select with select all and no custom slots", () => {
            const wrapper = mountComponent({items, multiple: true, selectAll: true}),
                slotNames = wrapper.findAll("[data-slot]").map(el => el.attributes("data-slot"));

            expect(slotNames).to.deep.equal(["subheader", "prepend-item", "chip"]);
        });

        it("renders the given selectAllTitle in the select all option", () => {
            const wrapper = mountComponent({items, multiple: true, selectAll: true, selectAllTitle: "All areas"});

            expect(wrapper.find("[data-slot='prepend-item'] v-list-item-stub").attributes("title")).to.equal("All areas");
        });

        it("renders the default title in the select all option if no selectAllTitle is given", () => {
            const wrapper = mountComponent({items, multiple: true, selectAll: true});

            expect(wrapper.find("[data-slot='prepend-item'] v-list-item-stub").attributes("title")).to.equal("common:shared.modules.dropdown.selectAll");
        });

        it("renders the default subheader slot for single select with no custom slots", () => {
            const wrapper = mountComponent({items}),
                slotNames = wrapper.findAll("[data-slot]").map(el => el.attributes("data-slot"));

            expect(slotNames).to.deep.equal(["subheader"]);
        });
    });
});
