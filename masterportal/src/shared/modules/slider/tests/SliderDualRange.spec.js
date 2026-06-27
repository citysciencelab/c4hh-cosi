import {config, shallowMount, mount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import SliderDualRange from "@shared/modules/slider/components/SliderDualRange.vue";

config.global.mocks.$t = key => key;

describe("src/shared/components/SliderDualRange.vue", () => {
    let interactionSpy, props;

    beforeEach(() => {
        interactionSpy = sinon.spy();

        props = {
            aria: "Aria-Label hier einfügen",
            id: "shared-slider",
            label: "Slider-Label",
            min: 0,
            max: 100,
            step: 1,
            values: [10, 40],
            disabled: false
        };
    });


    /**
     * Creates a Vuex store instance for testing purposes.
     * Allows for customization of modules, states, getters, mutations, or actions.
     * @param {Object} [overrides={}] - Custom overrides for the Vuex store configuration.
     * @param {Object} [overrides.ResizeHandle] - Overrides for the `ResizeHandle` module, such as getters.
     * @returns {Object} - A Vuex store instance configured with the provided overrides.
     */
    function createTestStore (overrides = {}) {
        return createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        ResizeHandle: {
                            namespaced: true,
                            getters: {
                                mainMenuWidth: () => 800,
                                secondaryMenuWidth: () => 800,
                                ...overrides.ResizeHandle?.getters
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Mounts the `SliderDualRange` for testing with customized props and Vuex store.
     * Automatically integrates the test Vuex store created by `createTestStore`.
     * @param {Object} [propsOverrides={}] - Custom overrides for component props.
     * @param {Object} [storeOverrides={}] - Custom overrides for the Vuex store configuration.
     * @returns {Wrapper} - A Vue Test Utils wrapper instance for the mounted component.
     */
    function mountComponent (propsOverrides = {}, storeOverrides = {}) {
        const testStore = createTestStore(storeOverrides);

        return shallowMount(SliderDualRange, {
            global: {plugins: [testStore]},
            props: {
                ...props,
                interaction: interactionSpy,
                ...propsOverrides}
        });
    }

    it("should render two sliders and trigger the given interaction on change", async () => {
        const wrapper = mountComponent({side: "mainMenu"}),
            inputStart = wrapper.find("#shared-slider-start"),
            inputEnd = wrapper.find("#shared-slider-end");

        expect(wrapper.find(".slider-track").exists()).to.be.true;
        expect(wrapper.find("#slider-range").exists()).to.be.true;
        expect(wrapper.find("#shared-slider-start").exists()).to.be.true;
        expect(wrapper.find("#shared-slider-start").attributes("value")).to.equals("10");
        expect(wrapper.find("#shared-slider-end").exists()).to.be.true;
        expect(wrapper.find("#shared-slider-end").attributes("value")).to.equals("40");

        inputStart.trigger("mouseup");
        inputEnd.trigger("mouseup");
        await wrapper.vm.$nextTick();
        expect(interactionSpy.calledTwice).to.be.true;
    });

    it("should render two disabled sliders correctly and block interactions", async () => {
        const wrapper = mountComponent({disabled: true}),
            inputStart = wrapper.find("#shared-slider-start"),
            inputEnd = wrapper.find("#shared-slider-end");

        expect(inputStart.exists()).to.be.true;
        expect(inputStart.element.disabled).to.equal(true);
        expect(inputEnd.exists()).to.be.true;
        expect(inputEnd.element.disabled).to.equal(true);

        inputStart.trigger("mouseup");
        inputEnd.trigger("mouseup");
        await wrapper.vm.$nextTick();
        expect(interactionSpy.called).to.be.false;
    });

    it("renders two sliders with props that aren't required", () => {
        const wrapper = mountComponent(),
            inputStart = wrapper.find("#shared-slider-start"),
            inputEnd = wrapper.find("#shared-slider-end"),
            label = wrapper.find(".labels");

        expect(inputStart.exists()).to.be.true;
        expect(inputStart.attributes("aria-label")).to.equal("Aria-Label hier einfügen");
        expect(inputStart.attributes("id")).to.equal("shared-slider-start");
        expect(wrapper.find({ref: "sliderValueStart"}).exists()).to.be.true;
        expect(inputStart.attributes("min")).to.equal("0");
        expect(inputStart.attributes("max")).to.equal("100");
        expect(inputStart.attributes("step")).to.equal("1");
        expect(inputStart.element.value).to.equal("10");
        expect(inputStart.element.disabled).to.equal(false);

        expect(inputEnd.exists()).to.be.true;
        expect(inputEnd.attributes("aria-label")).to.equal("Aria-Label hier einfügen");
        expect(inputEnd.attributes("id")).to.equal("shared-slider-end");
        expect(wrapper.find({ref: "sliderValueEnd"}).exists()).to.be.true;
        expect(inputEnd.attributes("min")).to.equal("0");
        expect(inputEnd.attributes("max")).to.equal("100");
        expect(inputEnd.attributes("step")).to.equal("1");
        expect(inputEnd.element.value).to.equal("40");
        expect(inputEnd.element.disabled).to.equal(false);

        expect(label.exists()).to.be.true;
        expect(label.text()).to.equal("Slider-Label");
    });

    it("should trigger the method updateSliderRangeLayout by mounted", () => {
        const updateSliderRangeLayoutSpy = sinon.spy(SliderDualRange.methods, "updateSliderRangeLayout");

        mountComponent({side: "mainMenu"});

        expect(updateSliderRangeLayoutSpy.calledOnce).to.be.true;
    });

    describe("updateSliderRangeLayout", () => {
        it("should update style from slider range", async () => {
            const testStore = createTestStore({}),
                wrapper = mount(SliderDualRange, {
                    global: {plugins: [testStore]},
                    props: {
                        ...props,
                        interaction: interactionSpy
                    }
                });

            await wrapper.vm.$nextTick();

            const container = wrapper.vm.$refs.sliderDualRange;

            Object.defineProperty(container, "offsetWidth", {
                value: 200,
                configurable: true
            });

            wrapper.vm.updateSliderRangeLayout(
                {
                    target: {
                        value: 10
                    }
                },
                "start"
            );

            expect(wrapper.find("#slider-range").element.style.left).to.equals("20px");
            expect(wrapper.find("#slider-range").element.style.width).to.equals("60px");
        });
    });
});
