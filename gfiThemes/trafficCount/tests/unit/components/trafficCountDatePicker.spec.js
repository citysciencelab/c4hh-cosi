import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import TrafficCountDatePicker from "../../../components/TrafficCountDatePicker.vue";
import dayjs from "dayjs";

describe("addons/trafficCount/components/TrafficCountDatePicker.vue", () => {
    let wrapper;

    afterEach(() => {
        if (wrapper) {
            wrapper.destroy();
        }
    });
    describe("Component DOM", () => {
        it("should initialize with given props", () => {
            wrapper = shallowMount(TrafficCountDatePicker, {
                propsData: {
                    type: "type",
                    format: "YYYY/DD/MM",
                    showWeekNumber: true,
                    inputDelimiter: "|",
                    initialDates: ["2022/13/09"]
                }
            });

            expect(wrapper.vm.type).to.equal("type");
            expect(wrapper.vm.format).to.equal("YYYY/DD/MM");
            expect(wrapper.vm.showWeekNumber).to.be.true;
            expect(wrapper.vm.inputDelimiter).to.equal("|");
            expect(wrapper.vm.initialDates).to.deep.equal(["2022/13/09"]);
        });
        it("should render with a datePickerContainer", () => {
            wrapper = shallowMount(TrafficCountDatePicker);

            expect(wrapper.find(".datePickerContainer").exists()).to.be.true;
        });
    });
    describe("methods", () => {
        describe("clearSelectedDates", () => {
            it("should clear selectedDates and inputDates", () => {
                wrapper = shallowMount(TrafficCountDatePicker);
                wrapper.vm.selectedDates = ["13.09.2022"];
                wrapper.vm.inputDates = ["13.09.2022"];
                wrapper.vm.clearSelectedDates();
                expect(wrapper.vm.selectedDates).to.be.an("array").that.is.empty;
                expect(wrapper.vm.inputDates).to.be.an("array").that.is.empty;
            });
        });
        describe("toggleCalendar", () => {
            it("should toggle isCalendarVisible from false to true", () => {
                wrapper = shallowMount(TrafficCountDatePicker);
                wrapper.vm.isCalendarVisible = false;
                wrapper.vm.toggleCalendar();
                expect(wrapper.vm.isCalendarVisible).to.be.true;
            });
            it("should toggle isCalendarVisible from true to false", () => {
                wrapper = shallowMount(TrafficCountDatePicker);
                wrapper.vm.isCalendarVisible = true;
                wrapper.vm.toggleCalendar();
                expect(wrapper.vm.isCalendarVisible).to.be.false;
            });
        });
        describe("toggleSelectedDateDay", () => {
            it("should do nothing if anything but an object with format function is given", () => {
                wrapper = shallowMount(TrafficCountDatePicker);

                expect(wrapper.vm.toggleSelectedDateDay(undefined)).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay(null)).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay(1234)).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay("string")).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay(true)).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay(false)).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay([])).to.be.false;
                expect(wrapper.vm.toggleSelectedDateDay({})).to.be.false;
            });
            it("should do nothing if selectedDates is anything but an array", () => {
                wrapper = shallowMount(TrafficCountDatePicker);

                wrapper.vm.selectedDates = undefined;
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = null;
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = 1234;
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = "string";
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = true;
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = false;
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
                wrapper.vm.selectedDates = {};
                expect(wrapper.vm.toggleSelectedDateDay({format: () => false})).to.be.false;
            });
            it("should push the the indicator for a date into selectedDates", () => {
                const momentDate = {
                    format: () => "dateStr"
                };

                wrapper = shallowMount(TrafficCountDatePicker);
                expect(wrapper.vm.toggleSelectedDateDay(momentDate)).to.be.true;
                expect(wrapper.vm.selectedDates).to.deep.equal(["dateStr"]);
            });
            it("should remove the the indicator for a date from selectedDates", () => {
                const momentDate = {
                        format: () => "dateStr"
                    },
                    expected = ["foo", "bar"];

                wrapper = shallowMount(TrafficCountDatePicker);
                wrapper.vm.selectedDates = ["foo", "dateStr", "bar"];
                expect(wrapper.vm.toggleSelectedDateDay(momentDate)).to.be.true;
                expect(wrapper.vm.selectedDates).to.deep.equal(expected);
            });
        });
        describe("toggleSelectedDateWeek", () => {
            it("should return false if selectedDates is not an array", () => {
                wrapper = shallowMount(TrafficCountDatePicker);

                wrapper.vm.selectedDates = undefined;
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = null;
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = 1234;
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = "string";
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = true;
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = false;
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
                wrapper.vm.selectedDates = {};
                expect(wrapper.vm.toggleSelectedDateWeek()).to.be.false;
            });
            it("should add the whole week of the given moment into selectedDates", () => {
                const momentDate = dayjs("2022-09-13", "YYYY-MM-DD"),
                    expected = ["2022-09-12", "2022-09-13", "2022-09-14", "2022-09-15", "2022-09-16", "2022-09-17", "2022-09-18"];

                wrapper = shallowMount(TrafficCountDatePicker);
                expect(wrapper.vm.toggleSelectedDateWeek(momentDate)).to.be.true;
                expect(wrapper.vm.selectedDates).to.deep.equal(expected);
            });
            it("should remove the whole week of the given moment into selectedDates if it is already selected", () => {
                const momentDate = dayjs("2022-09-13", "YYYY-MM-DD"),
                    expected = [
                        "2022-09-05", "2022-09-06", "2022-09-07", "2022-09-08", "2022-09-09", "2022-09-10", "2022-09-11",
                        "2022-09-19", "2022-09-20", "2022-09-21", "2022-09-22", "2022-09-23", "2022-09-24", "2022-09-25"
                    ];

                wrapper = shallowMount(TrafficCountDatePicker);
                wrapper.vm.selectedDates = [
                    "2022-09-05", "2022-09-06", "2022-09-07", "2022-09-08", "2022-09-09", "2022-09-10", "2022-09-11",
                    "2022-09-12", "2022-09-13", "2022-09-14", "2022-09-15", "2022-09-16", "2022-09-17", "2022-09-18",
                    "2022-09-19", "2022-09-20", "2022-09-21", "2022-09-22", "2022-09-23", "2022-09-24", "2022-09-25"
                ];
                expect(wrapper.vm.toggleSelectedDateWeek(momentDate)).to.be.true;
                expect(wrapper.vm.selectedDates).to.deep.equal(expected);
            });
            it("should add the monday of each entry of selectedDates into inputDates", () => {
                const momentDate = dayjs("2022-09-13", "YYYY-MM-DD"),
                    expected = ["2022-09-05", "2022-09-19", "2022-09-12"];

                wrapper = shallowMount(TrafficCountDatePicker, {
                    propsData: {
                        format: "YYYY-MM-DD"
                    }
                });
                wrapper.vm.selectedDates = [
                    "2022-09-05", "2022-09-06", "2022-09-07", "2022-09-08", "2022-09-09", "2022-09-10", "2022-09-11",
                    "2022-09-19", "2022-09-20", "2022-09-21", "2022-09-22", "2022-09-23", "2022-09-24", "2022-09-25"
                ];
                expect(wrapper.vm.toggleSelectedDateWeek(momentDate)).to.be.true;
                expect(wrapper.vm.inputDates).to.deep.equal(expected);
            });
            it("should only select 2 weeks and remove the first selected week", () => {
                const momentDate = dayjs("2022-09-13", "YYYY-MM-DD"),
                    expected = ["2022-09-19", "2022-09-12"],
                    localWrapper = shallowMount(TrafficCountDatePicker, {
                        propsData: {
                            format: "YYYY-MM-DD",
                            maxSelection: 2
                        }
                    });

                localWrapper.vm.selectedDates = [
                    "2022-09-05", "2022-09-06", "2022-09-07", "2022-09-08", "2022-09-09", "2022-09-10", "2022-09-11",
                    "2022-09-19", "2022-09-20", "2022-09-21", "2022-09-22", "2022-09-23", "2022-09-24", "2022-09-25"
                ];
                localWrapper.vm.inputDates = ["2022-09-05", "2022-09-19"];
                expect(localWrapper.vm.toggleSelectedDateWeek(momentDate)).to.be.true;
                expect(localWrapper.vm.inputDates).to.deep.equal(expected);
            });
        });
    });
    describe("mounted", () => {
        it("should initialize with correct selectedDates and inputDates if initialDates are given", () => {
            const initialDates = ["2022-09-09", "2022-09-14", "2022-09-24"],
                format = "YYYY-MM-DD",
                expected = [
                    "2022-09-05", "2022-09-06", "2022-09-07", "2022-09-08", "2022-09-09", "2022-09-10", "2022-09-11",
                    "2022-09-12", "2022-09-13", "2022-09-14", "2022-09-15", "2022-09-16", "2022-09-17", "2022-09-18",
                    "2022-09-19", "2022-09-20", "2022-09-21", "2022-09-22", "2022-09-23", "2022-09-24", "2022-09-25"
                ];

            wrapper = shallowMount(TrafficCountDatePicker, {
                propsData: {
                    type: "week",
                    initialDates,
                    format
                }
            });
            expect(wrapper.vm.selectedDates).to.deep.equal(expected);
        });
    });
});
