import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import TrafficCountDatePickerSwitcher from "../../../components/TrafficCountDatePickerSwitcher.vue";

describe("addons/trafficCount/components/TrafficCountDatePickerSwitcher.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(TrafficCountDatePickerSwitcher, {
            propsData: {
                currentSwitch: "2022-09",
                currentSwitchFormat: "YYYY-MM"
            }
        });
    });
    afterEach(() => {
        wrapper.destroy();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
        });
        it("should render the given props", () => {
            expect(wrapper.find(".date-label").text()).to.be.equal("2022-09");
        });
        it("should render its slot", () => {
            const wrapperTemp = shallowMount(TrafficCountDatePickerSwitcher, {
                propsData: {
                    currentSwitch: "2022-09",
                    currentSwitchFormat: "YYYY-MM"
                },
                scopedSlots: {
                    currentSwitch: `
                        <template slot-scope="{ momentDate }">CurrentSwitch: {{ momentDate.format('DD.MM.YYYY') }}</template>
                    `
                }
            });

            expect(wrapperTemp.find(".date-label").text()).to.be.equal("CurrentSwitch: 01.09.2022");
            wrapperTemp.destroy();
        });
    });

    describe("User Interactions", () => {
        it("should call the method yearDown", () => {
            const spyYearDown = sinon.spy(TrafficCountDatePickerSwitcher.methods, "yearDown"),
                wrapperTemp = shallowMount(TrafficCountDatePickerSwitcher, {
                    propsData: {
                        currentSwitch: "2022-09",
                        currentSwitchFormat: "YYYY-MM"
                    }
                }),
                buttonWrapperArray = wrapperTemp.findAll("button");

            buttonWrapperArray.at(0).trigger("click");
            expect(spyYearDown.calledOnce).to.be.true;

            wrapperTemp.destroy();
            spyYearDown.restore();
        });
        it("should call the method yearUp", () => {
            const spyYearUp = sinon.spy(TrafficCountDatePickerSwitcher.methods, "yearUp"),
                wrapperTemp = shallowMount(TrafficCountDatePickerSwitcher, {
                    propsData: {
                        currentSwitch: "2022-09",
                        currentSwitchFormat: "YYYY-MM"
                    }
                }),
                buttonWrapperArray = wrapperTemp.findAll("button");

            buttonWrapperArray.at(2).trigger("click");
            expect(spyYearUp.calledOnce).to.be.true;

            wrapperTemp.destroy();
            spyYearUp.restore();
        });
        it("should call the method monthDown", () => {
            const spyMonthDown = sinon.spy(TrafficCountDatePickerSwitcher.methods, "monthDown"),
                wrapperTemp = shallowMount(TrafficCountDatePickerSwitcher, {
                    propsData: {
                        currentSwitch: "2022-09",
                        currentSwitchFormat: "YYYY-MM"
                    }
                }),
                buttonWrapperArray = wrapperTemp.findAll("button");

            buttonWrapperArray.at(1).trigger("click");
            expect(spyMonthDown.calledOnce).to.be.true;

            wrapperTemp.destroy();
            spyMonthDown.restore();
        });
        it("should call the method monthUp", () => {
            const spymonthUp = sinon.spy(TrafficCountDatePickerSwitcher.methods, "monthUp"),
                wrapperTemp = shallowMount(TrafficCountDatePickerSwitcher, {
                    propsData: {
                        currentSwitch: "2022-09",
                        currentSwitchFormat: "YYYY-MM"
                    }
                }),
                buttonWrapperArray = wrapperTemp.findAll("button");

            buttonWrapperArray.at(3).trigger("click");
            expect(spymonthUp.calledOnce).to.be.true;

            wrapperTemp.destroy();
            spymonthUp.restore();
        });
    });

    describe("methods", () => {
        it("should emitted the event yearDown", () => {
            wrapper.vm.yearDown();
            expect(wrapper.emitted()).to.have.property("yearDown");
        });
        it("should emitted the event yearUp", () => {
            wrapper.vm.yearUp();
            expect(wrapper.emitted()).to.have.property("yearUp");
        });
        it("should emitted the event monthDown", () => {
            wrapper.vm.monthDown();
            expect(wrapper.emitted()).to.have.property("monthDown");
        });
        it("should emitted the event monthUp", () => {
            wrapper.vm.monthUp();
            expect(wrapper.emitted()).to.have.property("monthUp");
        });
    });
});
