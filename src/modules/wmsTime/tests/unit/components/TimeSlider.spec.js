import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import layerCollection from "@core/layers/js/layerCollection.js";

import TimeSlider from "@modules/wmsTime/components/TimeSlider.vue";

config.global.mocks.$t = key => key;

describe("src/modules/wmsTime/components/TimeSlider.vue", () => {
    let store,
        timeSliderActive,
        winWidth,
        defaultDimension,
        dualRangeSlider,
        defaultValueEnd,
        timeRange,
        displayFormat,
        displayTimezone;

    beforeEach(() => {
        defaultDimension = "TIME";
        dualRangeSlider = false;
        timeRange = ["2020-01-01"];
        defaultValueEnd = null;
        displayFormat = null;
        displayTimezone = null;

        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        namespaced: true,
                        WmsTime: {
                            namespaced: true,
                            getters: {
                                timeRange: () => {
                                    return timeRange;
                                },
                                minWidth: () => {
                                    return winWidth > 800;
                                },
                                defaultValue: () => sinon.stub(),
                                defaultValueEnd: () => defaultValueEnd,
                                defaultDimensionName: () => defaultDimension,
                                dualRangeSlider: () => dualRangeSlider,
                                displayFormat: () => displayFormat,
                                displayTimezone: () => displayTimezone,
                                timeSlider: () => {
                                    return {
                                        active: timeSliderActive,
                                        currentLayerId: "",
                                        objects: [],
                                        playbackDelay: 1,
                                        playing: false
                                    };
                                },
                                staticDimensions: () => {
                                    return {
                                        "elevation": true,
                                        "REFERENCE_TIME": true
                                    };
                                }
                            },
                            actions: {
                                updateMap: sinon.spy(),
                                toggleSwiper: sinon.spy()
                            },
                            mutations: {
                                setWindowWidth: (number) => {
                                    winWidth = number;
                                },
                                setTimeSliderActive: (active) => {
                                    timeSliderActive = active;
                                },
                                setTimeSliderPlaying: sinon.stub()
                            }
                        },
                        LayerSwiper: {
                            namespaced: true,
                            state: {
                                active: false
                            },
                            getters: {
                                active: state => state.active
                            },
                            mutations: {
                                setActive: (state, active) => {
                                    state.active = active;
                                }
                            }
                        },
                        CompareMaps: {
                            namespaced: true,
                            getters: {
                                active: () => false
                            }
                        }
                    }
                }
            }
        });
        timeSliderActive = false;
        winWidth = 801;
    });

    afterEach(() => {
        winWidth = 1024;
        timeSliderActive = false;
    });

    it("renders the TimeSlider component without the possibility to activate the the LayerSwiper component if window.innerWidth is below 800", () => {
        winWidth = 799;
        timeSliderActive = true;
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}});

        expect(wrapper.find(".timeSlider-innerWrapper-interactions").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper-interactions").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-button-backward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-backward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-play-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-play-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-forward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-forward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("slider-item-stub").exists()).to.be.true;
        expect(wrapper.find("slider-item-stub").attributes("id")).to.equals("timeSlider-input-range-layerId");
        expect(wrapper.find("slider-item-stub").attributes("aria")).to.equals("common:modules.wmsTime.timeSlider.inputRangeLabel");
        expect(wrapper.find("slider-item-stub").attributes("classarray")).to.equals("timeSlider-input-range-label-input");
        expect(wrapper.find("slider-item-stub").attributes("min")).to.equals("0");
        expect(wrapper.find("slider-item-stub").attributes("max")).to.equals("0");
        expect(wrapper.find("slider-item-stub").attributes("step")).to.equals("1");
        expect(wrapper.find("slider-item-stub").attributes("value")).to.equals("-1");
    });

    it("renders the TimeSlider as dual range slider component without the possibility to activate the the LayerSwiper component if window.innerWidth is below 800", () => {
        dualRangeSlider = true;
        winWidth = 799;
        timeSliderActive = true;
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}});

        expect(wrapper.find(".timeSlider-innerWrapper-interactions").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper-interactions").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-button-backward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-backward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-play-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-play-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-forward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-forward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("slider-dual-range-stub").exists()).to.be.true;
        expect(wrapper.find("slider-dual-range-stub").attributes("id")).to.equals("timeSlider-input-range-layerId");
        expect(wrapper.find("slider-dual-range-stub").attributes("aria")).to.equals("common:modules.wmsTime.timeSlider.inputRangeLabel");
        expect(wrapper.find("slider-dual-range-stub").attributes("min")).to.equals("0");
        expect(wrapper.find("slider-dual-range-stub").attributes("max")).to.equals("0");
        expect(wrapper.find("slider-dual-range-stub").attributes("step")).to.equals("1");
        expect(wrapper.find("slider-dual-range-stub").attributes("values")).to.equals("-1,0");
    });

    it("renders the TimeSlider component with the possibility to activate the the LayerSwiper component and the text to activate it if it is currently inactive", () => {
        winWidth = 801;
        timeSliderActive = true;
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}
        });

        expect(wrapper.find(".timeSlider-innerWrapper-interactions").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper-interactions").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-button-backward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-backward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-play-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-play-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-forward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-forward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("slider-item-stub").exists()).to.be.true;
        expect(wrapper.find("slider-item-stub").attributes("id")).to.equals("timeSlider-input-range-layerId");
        expect(wrapper.find(".timeSlider-innerWrapper").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").element.tagName).to.equal("FLAT-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").attributes("text")).to.equal("common:modules.wmsTime.timeSlider.buttons.layerSwiper");
    });

    it("renders the TimeSlider component with the possibility to activate the the LayerSwiper component and the text to deactivate it if it is currently active", () => {
        winWidth = 801;
        timeSliderActive = true;
        store.commit("Modules/LayerSwiper/setActive", true);
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}
        });

        expect(wrapper.find(".timeSlider-innerWrapper-interactions").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper-interactions").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-button-backward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-backward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-play-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-play-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-button-forward-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-button-forward-layerId").element.tagName).to.equal("ICON-BUTTON-STUB");
        expect(wrapper.find("slider-item-stub").exists()).to.be.true;
        expect(wrapper.find("slider-item-stub").attributes("id")).to.equals("timeSlider-input-range-layerId");
        expect(wrapper.find(".timeSlider-innerWrapper").exists()).to.be.true;
        expect(wrapper.find(".timeSlider-innerWrapper").element.tagName).to.equal("DIV");
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").exists()).to.be.true;
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").element.tagName).to.equal("FLAT-BUTTON-STUB");
        expect(wrapper.find("#timeSlider-activate-layerSwiper-layerId").attributes("text")).to.equal("common:modules.wmsTime.timeSlider.buttons.deactivateLayerSwiper");
    });

    it("should format the current timestamp", async () => {
        timeRange = ["2020-01-01T10:12:34.567Z"];
        displayFormat = "DD.MM.YYYY HH:mm";
        timeSliderActive = true;
        store.commit("Modules/LayerSwiper/setActive", true);
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}
        });

        await wrapper.vm.$nextTick();
        expect(wrapper.find("#timeSlider-input-range-layerId").attributes().label).to.be.equals("01.01.2020 10:12");
    });

    it("should keep the timestamp without format", async () => {
        timeRange = ["2020-01-01T10:12:34.567Z"];
        timeSliderActive = true;
        store.commit("Modules/LayerSwiper/setActive", true);
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find("#timeSlider-input-range-layerId").attributes().label).to.be.equals("2020-01-01T10:12:34.567Z");
    });

    it("should transform timestamp to timezone", async () => {
        timeRange = ["2020-01-01T10:12:34.567Z"];
        displayFormat = "DD.MM.YYYY HH:mm";
        displayTimezone = "Europe/Berlin";
        timeSliderActive = true;
        store.commit("Modules/LayerSwiper/setActive", true);
        const wrapper = shallowMount(TimeSlider, {
            global: {
                plugins: [store]
            },
            propsData: {layerId: "layerId"}
        });

        await wrapper.vm.$nextTick();

        expect(wrapper.find("#timeSlider-input-range-layerId").attributes().label).to.be.equals("01.01.2020 11:12");
    });

    describe("watcher sliderValue", () => {
        let updateTimeSpy,
            wrapper;

        beforeEach(() => {
            updateTimeSpy = sinon.spy();

            wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            sinon.stub(layerCollection, "getLayerById").returns(
                {
                    id: "1",
                    updateTime: updateTimeSpy
                }
            );
        });

        it("should update time layer, if slider value is changend", async () => {
            wrapper.vm.sliderValue = 1;

            await wrapper.vm.$nextTick();

            expect(updateTimeSpy.called).to.be.true;
            expect(updateTimeSpy.firstCall.args[0]).to.equals("1");
            expect(updateTimeSpy.firstCall.args[1]).to.equals("TIME");
            expect(updateTimeSpy.firstCall.args[2]).to.equals("2020-01-01");
            expect(updateTimeSpy.firstCall.args[3]).to.be.null;
            expect(updateTimeSpy.firstCall.args[4]).to.deep.equals({
                elevation: true,
                REFERENCE_TIME: true
            });
        });
    });

    describe("animate", () => {
        it("should increase slider value", () => {
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 1;
            wrapper.vm.animate();

            expect(wrapper.vm.sliderValue).to.equals(2);
        });

        it("should increase slider value and slider value end", () => {
            dualRangeSlider = true;
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 1;
            wrapper.vm.sliderValueEnd = 3;
            wrapper.vm.animate();

            expect(wrapper.vm.sliderValue).to.equals(2);
            expect(wrapper.vm.sliderValueEnd).to.equals(4);
        });
    });

    describe("nextIndex", () => {
        it("should return slider value + 1, if forward is true", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            expect(wrapper.vm.nextIndex(2, true)).to.equals(3);
        });

        it("should return slider value - 1, if forward is false", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            expect(wrapper.vm.nextIndex(2, false)).to.equals(1);
        });
    });

    describe("moveOne", () => {
        it("should set slider value + 1, if forward is true", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;
            wrapper.vm.moveOne(true);

            expect(wrapper.vm.sliderValue).to.equals(3);
        });

        it("should set slider value - 1, if forward is false", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;
            wrapper.vm.moveOne(false);

            expect(wrapper.vm.sliderValue).to.equals(1);
        });

        it("should set slider value and slider value end + 1, if forward is true", () => {
            dualRangeSlider = true;

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;
            wrapper.vm.sliderValueEnd = 5;
            wrapper.vm.moveOne(true);

            expect(wrapper.vm.sliderValue).to.equals(3);
            expect(wrapper.vm.sliderValueEnd).to.equals(6);
        });

        it("should set slider value and slider value end - 1, if forward is false", () => {
            dualRangeSlider = true;

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;
            wrapper.vm.sliderValueEnd = 5;
            wrapper.vm.moveOne(false);

            expect(wrapper.vm.sliderValue).to.equals(1);
            expect(wrapper.vm.sliderValueEnd).to.equals(4);
        });
    });

    describe("play", () => {
        it("should set slider value to 0,if slider value length equals time range length", () => {
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 6;
            wrapper.vm.play();

            expect(wrapper.vm.sliderValue).to.equals(0);
        });

        it("should set slider value to 0 and slider value end to 3,if slider value end length equals time range length", () => {
            dualRangeSlider = true;
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 3;
            wrapper.vm.sliderValueEnd = 6;
            wrapper.vm.play();

            expect(wrapper.vm.sliderValue).to.equals(0);
            expect(wrapper.vm.sliderValueEnd).to.equals(3);
        });
    });

    describe("calculateSliderValueEnd", () => {
        it("should return 1, if slider value === 0", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 0;

            expect(wrapper.vm.calculateSliderValueEnd()).to.equals(1);
        });

        it("should return 5, if slider value === sliderOptionCount", () => {
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 6;

            expect(wrapper.vm.calculateSliderValueEnd()).to.equals(5);
        });

        it("should return 3, if slider value === 2", () => {
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;

            expect(wrapper.vm.calculateSliderValueEnd()).to.equals(3);
        });

        it("should return the position of default value end, if this is configured", () => {
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01", "2023-01-01", "2024-01-01", "2025-01-01", "2026-01-01"];
            defaultValueEnd = "2024-01-01";

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.sliderValue = 2;

            expect(wrapper.vm.calculateSliderValueEnd()).to.equals(4);
        });
    });

    describe("updateSliderValue", () => {
        let updateTimeSpy;

        beforeEach(() => {
            updateTimeSpy = sinon.spy();

            sinon.stub(layerCollection, "getLayerById").returns(
                {
                    id: "1",
                    updateTime: updateTimeSpy
                }
            );
        });

        it("should update time layer with single slider value", () => {
            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.updateSliderValue();

            expect(updateTimeSpy.called).to.be.true;
            expect(updateTimeSpy.firstCall.args[0]).to.equals("1");
            expect(updateTimeSpy.firstCall.args[1]).to.equals("TIME");
            expect(updateTimeSpy.firstCall.args[2]).to.equals("2020-01-01");
            expect(updateTimeSpy.firstCall.args[3]).to.be.null;
            expect(updateTimeSpy.firstCall.args[4]).to.deep.equals({
                elevation: true,
                REFERENCE_TIME: true
            });
        });

        it("should update time layer with dual range slider values", () => {
            dualRangeSlider = true;
            timeRange = ["2020-01-01", "2021-01-01", "2022-01-01"];

            const wrapper = shallowMount(TimeSlider, {
                global: {
                    plugins: [store]
                },
                propsData: {layerId: "1"}
            });

            wrapper.vm.updateSliderValue();

            expect(updateTimeSpy.called).to.be.true;
            expect(updateTimeSpy.firstCall.args[0]).to.equals("1");
            expect(updateTimeSpy.firstCall.args[1]).to.equals("TIME");
            expect(updateTimeSpy.firstCall.args[2]).to.equals("2020-01-01");
            expect(updateTimeSpy.firstCall.args[3]).to.equals("2021-01-01");
            expect(updateTimeSpy.firstCall.args[4]).to.deep.equals({
                elevation: true,
                REFERENCE_TIME: true
            });
        });
    });
});
