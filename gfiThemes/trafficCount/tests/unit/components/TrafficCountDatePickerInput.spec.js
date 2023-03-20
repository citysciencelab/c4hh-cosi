import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import TrafficCountDatePickerInput from "../../../components/TrafficCountDatePickerInput.vue";

describe("addons/trafficCount/components/TrafficCountDatePickerInput.spec.js", () => {
    let wrapper;

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
    });
    describe("Component DOM", () => {
        it("should exist", () => {
            wrapper = shallowMount(TrafficCountDatePickerInput);
            expect(wrapper.exists()).to.be.true;
            expect(wrapper.find(".input-wrapper").exists()).to.be.true;
        });
        it("should render given props", () => {
            wrapper = shallowMount(TrafficCountDatePickerInput, {
                propsData: {
                    inputDates: ["01.01.1999", "01.01.2000"],
                    delimiter: "|"
                }
            });
            expect(wrapper.find(".date-input").element.value).to.be.equal("01.01.1999|01.01.2000");
        });
    });
    describe("User interaction", () => {
        it("should call the toggle function", async () => {
            const toggleFunction = sinon.spy(TrafficCountDatePickerInput.methods, "toggleCalendar");

            wrapper = shallowMount(TrafficCountDatePickerInput, {
                propsData: {
                    inputDates: ["01.01.1999", "01.01.2000"],
                    delimiter: "|"
                }
            });

            await wrapper.find("input").trigger("click");

            expect(toggleFunction.calledOnce).to.be.true;
            toggleFunction.restore();
        });
        it("should emit the toggle", () => {
            wrapper = shallowMount(TrafficCountDatePickerInput);
            wrapper.vm.toggleCalendar();
            expect(wrapper.emitted()).to.have.property("toggleCalendar");
        });
        it("should call the clear function", async () => {
            const clearFunction = sinon.spy(TrafficCountDatePickerInput.methods, "clearInput");

            wrapper = shallowMount(TrafficCountDatePickerInput, {
                propsData: {
                    inputDates: ["01.01.1999", "01.01.2000"],
                    delimiter: "|"
                }
            });

            await wrapper.find(".bi-x").trigger("click");

            expect(clearFunction.calledOnce).to.be.true;
            clearFunction.restore();
        });
        it("should emit the clear", () => {
            wrapper = shallowMount(TrafficCountDatePickerInput);
            wrapper.vm.clearInput();
            expect(wrapper.emitted()).to.have.property("clearInput");
        });
    });
});
