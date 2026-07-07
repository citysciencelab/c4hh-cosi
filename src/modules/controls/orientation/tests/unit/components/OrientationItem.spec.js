import {createStore} from "vuex";
import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import OrientationItemComponent from "@modules/controls/orientation/components/OrientationItem.vue";
import layerCollection from "@core/layers/js/layerCollection.js";


describe("src/modules/controls/orientation/components/OrientationItem.vue", () => {
    let store,
        onlyFilteredFeatures = false,
        showDirection = false,
        iconGeolocationMarker;
    const mockAlertingActions = {
        addSingleAlert: sinon.stub()
    };

    beforeEach(() => {
        iconGeolocationMarker = "bi-crosshair";
        showDirection = false;
        store = createStore({
            namespaced: true,
            modules: {
                Controls: {
                    namespaced: true,
                    modules: {
                        Orientation: {
                            namespaced: true,
                            getters: {
                                geolocation: sinon.stub(),
                                iconGeolocate: sinon.stub(),
                                iconGeolocatePOI: sinon.stub(),
                                iconGeolocationMarker: () => iconGeolocationMarker,
                                poiDistances: () => [],
                                poiMode: sinon.stub(),
                                poiModeCurrentPositionEnabled: sinon.stub(),
                                showPoi: sinon.stub(),
                                showPoiChoice: sinon.stub(),
                                showPoiIcon: sinon.stub(),
                                showDirection: () => showDirection,
                                showAccuracy: () => false,
                                zoomMode: sinon.stub(),
                                onlyFilteredFeatures: () => onlyFilteredFeatures
                            }
                        }
                    }
                },
                Alerting: {
                    namespaced: true,
                    actions: mockAlertingActions

                }
            },
            getters: {
                visibleLayerConfigs: sinon.stub()
            }
        });
    });


    it("renders the Orientation component", () => {
        const wrapper = shallowMount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find(".orientationButtons").exists()).to.be.true;
        expect(wrapper.find("#geolocation_marker").exists()).to.be.true;
        expect(wrapper.find("#geolocation_marker > i").wrapperElement.className).to.be.equals(iconGeolocationMarker);
    });

    it("renders the Orientation button", () => {
        const wrapper = shallowMount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#geolocate").exists()).to.be.true;
    });

    it("will not render the Poi Orientation button", () => {
        const wrapper = shallowMount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        expect(wrapper.find("#geolocatePOI").exists()).to.be.false;
    });

    it("will union the array", () => {
        const wrapper = shallowMount(OrientationItemComponent, {
                global: {
                    plugins: [store]
                }}),
            arr1 = [3, 3, 4],
            arr2 = [5, 6, 7],
            arr = [3, 4, 5, 6, 7];

        expect(wrapper.vm.union(arr1, arr2, (obj1, obj2) => obj1 === obj2)).to.deep.equal(arr);
    });

    it("creates marker direction style from heading", () => {
        showDirection = true;
        const wrapper = mount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        wrapper.vm.heading = Math.PI / 2;

        expect(wrapper.vm.markerDirectionStyle["--marker-heading-angle"]).to.equal("90deg");
    });

    it("calculates fallback heading from movement", () => {
        const wrapper = mount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        const heading = wrapper.vm.calculateHeadingFromPositions([0, 0], [1, 0]);

        expect(heading).to.be.closeTo(Math.PI / 2, 0.001);
    });

    it("prefers native heading if available", () => {
        const wrapper = mount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        const heading = wrapper.vm.resolveHeading(1.2, [0, 0], [1, 0]);

        expect(heading).to.equal(1.2);
    });

    it("uses fallback heading if native heading missing", () => {
        const wrapper = mount(OrientationItemComponent, {
            global: {
                plugins: [store]
            }});

        const heading = wrapper.vm.resolveHeading(null, [0, 0], [1, 0]);

        expect(heading).to.be.closeTo(Math.PI / 2, 0.001);
    });
    describe("OrientationItem.vue methods", () => {
        const centerPosition = [0, 0],
            distance = 100,
            features = [{
                getStyle: () => {
                    return {
                        getImage: sinon.stub()
                    };
                },
                getGeometry: () => {
                    return {
                        getClosestPoint: () => {
                            return [10, 10];
                        }
                    };
                },
                get: () => sinon.stub()
            },
            {
                getStyle: () => {
                    return () => null;
                },
                getGeometry: () => {
                    return {
                        getClosestPoint: () => {
                            return [15, 10];
                        }
                    };
                },
                get: () => sinon.stub()
            }],
            layerSource = {
                getFeaturesInExtent: () => {
                    return features;
                }
            },
            wfsLayer = {
                has: () => {
                    return true;
                },
                get: (key) => {
                    if (key === "layerSource") {
                        return layerSource;
                    }
                    else if (key === "styleId") {
                        return "123";
                    }
                    else if (key === "name") {
                        return "TestLayer";
                    }
                    return "";
                },
                getLayerSource: () => layerSource
            },
            layerConfigs = [
                {
                    id: "1",
                    typ: "WFS",
                    visibility: true
                },
                {
                    id: "2",
                    typ: "WFS",
                    visibility: true
                },
                {
                    id: "3",
                    typ: "WFS",
                    visibility: true
                }
            ];

        it("getVectorFeaturesInCircle returns all features", () => {
            const wrapper = shallowMount(OrientationItemComponent, {
                global: {
                    plugins: [store]
                }});
            let returnedFeatures = "";

            sinon.stub(layerCollection, "getLayerById").returns(wfsLayer);
            returnedFeatures = wrapper.vm.getVectorFeaturesInCircle(layerConfigs, distance, centerPosition);
            expect(returnedFeatures.length).to.be.equals(2);
        });
        it("getVectorFeaturesInCircle returns only filtered features", () => {
            onlyFilteredFeatures = true;
            const wrapper = shallowMount(OrientationItemComponent, {
                global: {
                    plugins: [store]
                }});
            let returnedFeatures = "";

            sinon.stub(layerCollection, "getLayerById").returns(wfsLayer);
            returnedFeatures = wrapper.vm.getVectorFeaturesInCircle(layerConfigs, distance, centerPosition);
            expect(returnedFeatures.length).to.be.equals(1);
        });
        it("getVectorFeaturesInCircle returns only features in extent", () => {
            let returnedFeatures = "";
            const wrapper = shallowMount(OrientationItemComponent, {
                global: {
                    plugins: [store]
                }});

            sinon.stub(layerCollection, "getLayerById").returns(wfsLayer);
            returnedFeatures = wrapper.vm.getVectorFeaturesInCircle(layerConfigs, 15, centerPosition);
            expect(returnedFeatures.length).to.be.equals(1);
        });
    });

});
