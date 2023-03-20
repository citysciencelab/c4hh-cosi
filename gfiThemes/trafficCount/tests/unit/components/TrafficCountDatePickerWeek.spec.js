import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TrafficCountDatePickerWeek from "../../../components/TrafficCountDatePickerWeek.vue";

describe("addons/trafficCount/components/TrafficCountDatePickerWeek.spec.js", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(TrafficCountDatePickerWeek);
    });
    afterEach(() => {
        wrapper.destroy();
    });
    describe("Component DOM", () => {
        it("should exist", () => {
            expect(wrapper.exists()).to.be.true;
            expect(wrapper.find(".datePickerWeek").exists()).to.be.true;
        });
        it("should render given props", () => {
            const wrapperTemp = shallowMount(TrafficCountDatePickerWeek, {
                propsData: {
                    showWeekNumber: true,
                    selectedDates: ["2022-09-12", "2022-09-10"]
                }
            });

            expect(wrapperTemp.vm.showWeekNumber).to.be.true;
            expect(wrapperTemp.vm.selectedDates).to.deep.equal(["2022-09-12", "2022-09-10"]);

            wrapperTemp.destroy();
        });
    });
    describe("methods", () => {
        describe("toggleSelectedDate", () => {
            it("should emit toggleSelectedDate with the given date", () => {
                wrapper.vm.toggleSelectedDate("date");
                expect(wrapper.emitted("toggleSelectedDate")).to.be.an("array").and.to.have.lengthOf(1);
                expect(wrapper.emitted("toggleSelectedDate")[0]).to.be.an("array").and.to.have.lengthOf(1);
                expect(wrapper.emitted("toggleSelectedDate")[0][0]).to.equal("date");
            });
        });
        describe("yearDown", () => {
            it("should decrement currentSwitch by one year", () => {
                wrapper.vm.currentSwitch = "2022-09";
                wrapper.vm.yearDown();
                expect(wrapper.vm.currentSwitch).to.equal("2021-09");
            });
        });
        describe("yearUp", () => {
            it("should increment currentSwitch by one year", () => {
                wrapper.vm.currentSwitch = "2022-09";
                wrapper.vm.yearUp();
                expect(wrapper.vm.currentSwitch).to.equal("2023-09");
            });
        });
        describe("monthDown", () => {
            it("should decrement currentSwitch by one month", () => {
                wrapper.vm.currentSwitch = "2022-01";
                wrapper.vm.monthDown();
                expect(wrapper.vm.currentSwitch).to.equal("2021-12");
            });
        });
        describe("monthUp", () => {
            it("should increment currentSwitch by one month", () => {
                wrapper.vm.currentSwitch = "2022-12";
                wrapper.vm.monthUp();
                expect(wrapper.vm.currentSwitch).to.equal("2023-01");
            });
        });
    });
});
