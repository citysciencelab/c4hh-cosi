import {config, mount, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import DynamicInputByType from "../../../../../components/shared/components/DynamicInputByType.vue";

config.global.mocks.$t = key => key;

describe("addons/SimulationTool/components/shared/components/DynamicInputByType.vue", () => {
    let store;
    const factory = {
        getShallowMount: (propsData) => {
            return shallowMount(DynamicInputByType, {
                props: propsData
            });
        },
        getMount: (propsData) => {
            return mount(DynamicInputByType, {
                props: propsData,
                global: {
                    plugins: [store]
                }
            });
        }
    };

    beforeEach(() => {
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 800,
                                secondaryMenuWidth: () => 800
                            }
                        }
                    }
                }
            }
        });
    });

    describe("Rendering", () => {
        it("renders InputText when inputType is 'string'", () => {
            const wrapper = factory.getShallowMount({
                id: "test-id",
                label: "Test Label",
                inputType: "string",
                value: "Test Value"
            });

            expect(wrapper.findComponent({name: "InputText"}).exists()).to.be.true;
            wrapper.unmount();
        });

        it("renders SwitchInput when inputType is 'boolean'", () => {
            const wrapper = factory.getShallowMount({
                id: "test-id",
                label: "Test Label",
                inputType: "boolean",
                checked: true
            });

            expect(wrapper.findComponent({name: "SwitchInput"}).exists()).to.be.true;
            wrapper.unmount();
        });

        it("renders SliderItem when inputType is 'number'", () => {
            const wrapper = factory.getShallowMount({
                id: "test-id",
                label: "Test Label",
                inputType: "number",
                value: 50,
                min: 0,
                max: 100,
                step: 1
            });

            expect(wrapper.findComponent({name: "SliderItem"}).exists()).to.be.true;
            wrapper.unmount();
        });
    });

    describe("Emitted Events", () => {
        it("emits 'update:value' when InputText value changes", async () => {
            const wrapper = factory.getMount({
                    id: "test-id",
                    label: "Test Label",
                    inputType: "string",
                    value: "Test Value"
                }),
                inputText = wrapper.findComponent({name: "InputText"});

            await inputText.setValue("New Value");

            expect(wrapper.emitted("update:value")).to.exist;
            expect(wrapper.emitted("update:value")[0]).to.deep.equal(["New Value"]);
            wrapper.unmount();
        });

        it("emits 'update:checked' when SwitchInput is toggled", async () => {
            const wrapper = factory.getMount({
                    id: "test-id",
                    label: "Test Label",
                    inputType: "boolean",
                    checked: false
                }),
                switchInput = wrapper.find("input[type='checkbox']");

            await switchInput.setChecked(true);

            expect(wrapper.emitted("update:checked")).to.exist;
            expect(wrapper.emitted("update:checked")[0]).to.deep.equal([true]);
            wrapper.unmount();
        });

        it("emits 'update:value' when SliderItem value changes", async () => {
            const wrapper = factory.getMount({
                    id: "test-id",
                    label: "Test Label",
                    inputType: "number",
                    value: 50,
                    min: 0,
                    max: 100,
                    step: 1
                }),
                slider = wrapper.find("#test-id");

            await slider.setValue(75);

            expect(wrapper.emitted("update:value")).to.exist;
            expect(wrapper.emitted("update:value")[0]).to.deep.equal([75]);
            wrapper.unmount();
        });
    });

    describe("Props Validation", () => {
        it("renders default props correctly", () => {
            const wrapper = factory.getShallowMount({
                id: "test-id",
                label: "Test Label"
            });

            expect(wrapper.props("aria")).to.equal("");
            expect(wrapper.props("checked")).to.be.false;
            expect(wrapper.props("inputType")).to.equal("string");
            expect(wrapper.props("max")).to.equal(100);
            expect(wrapper.props("min")).to.equal(0);
            expect(wrapper.props("placeholder")).to.equal("");
            expect(wrapper.props("step")).to.equal(1);
            expect(wrapper.props("value")).to.be.undefined;
            wrapper.unmount();
        });
    });
});
