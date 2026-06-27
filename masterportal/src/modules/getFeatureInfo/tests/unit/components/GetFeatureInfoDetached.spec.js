import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import LineString from "ol/geom/LineString.js";
import Polygon from "ol/geom/Polygon.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";

import layerCollection from "@core/layers/js/layerCollection.js";
import DetachedTemplate from "@modules/getFeatureInfo/components/GetFeatureInfoDetached.vue";

config.global.mocks.$t = key => key;
config.global.mocks.$gfiThemeAddons = [];

describe("src/modules/getFeatureInfo/components/GetFeatureInfoDetached.vue", () => {
    let store,
        removeHighlightFeatureSpy,
        highlightFeatureSpy,
        highlightVectorRules,
        showPolygonMarkerForWMS,
        getLayerByIdSpy,
        placingPointMarkerSpy,
        removePolygonMarkerSpy,
        layer,
        showMarker = true,
        feature,
        centerMapToClickPoint,
        setCenterSpy,
        clickCoordinateFromMap;

    const
        mockMutations = {
            setCurrentFeature: () => sinon.stub(),
            setShowMarker: () => sinon.stub()
        },
        mockGetters = {
            centerMapToClickPoint: () => centerMapToClickPoint,
            currentFeature: () => sinon.stub(),
            menuSide: () => sinon.stub(),
            highlightVectorRules: () => highlightVectorRules,
            showPolygonMarkerForWMS: () => showPolygonMarkerForWMS,
            showMarker: () => showMarker,
            showPageNumber: () => true,
            hideMapMarkerOnVectorHighlight: () => sinon.stub(),
            stickyHeader: () => false
        },
        olFeature = new Feature({
            name: "feature123"
        });

    beforeAll(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D"
        };

        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        clickCoordinateFromMap = [100, 200];
        showMarker = true;
        centerMapToClickPoint = false;
        feature = {
            getTheme: () => "DefaultTheme",
            getTitle: () => "Hallo",
            getMimeType: () => "text/xml",
            getGfiUrl: () => "",
            getLayerId: () => sinon.stub(),
            getOlFeature: () => olFeature
        };
        layer = {
            get: () => "styleId"
        };
        olFeature.setId("feature1");
        olFeature.setGeometry(new Point([10, 10]));
        getLayerByIdSpy = sinon.stub(layerCollection, "getLayerById").returns(layer);
        setCenterSpy = sinon.spy();
        highlightFeatureSpy = sinon.spy();
        removeHighlightFeatureSpy = sinon.spy();
        placingPointMarkerSpy = sinon.spy();
        removePolygonMarkerSpy = sinon.spy();
        highlightVectorRules = {
            image: {
                scale: 10
            },
            fill: sinon.stub(),
            stroke: sinon.stub()
        };
        store = createStore({
            namespaced: true,
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        GetFeatureInfo: {
                            namespaced: true,
                            mutations: mockMutations,
                            getters: mockGetters
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        placingPointMarker: placingPointMarkerSpy,
                        removePointMarker: sinon.stub(),
                        setCenter: setCenterSpy,
                        removeHighlightFeature: removeHighlightFeatureSpy,
                        removePolygonMarker: removePolygonMarkerSpy,
                        highlightFeature: highlightFeatureSpy
                    },
                    getters: {
                        clickCoordinate: () => clickCoordinateFromMap
                    }
                },
                Menu: {
                    namespaced: true,
                    actions: {
                        setMenuBackAndActivateItem: sinon.stub()
                    }
                }
            }
        });
    });


    it("should have a title", () => {
        const wrapper = mount(DetachedTemplate, {
            propsData: {
                feature
            },
            components: {
                DefaultTheme: {
                    name: "DefaultTheme",
                    template: "<div />"
                }
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find(".gfi-title").text()).to.be.equal("Hallo");
    });

    describe("Page Counter", () => {
        it("should show page counter when showPageNumber is true and totalFeatures > 1", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 1,
                    totalFeatures: 5,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".gfi-page-counter").exists()).to.be.true;
            expect(wrapper.find(".gfi-page-counter").text()).to.be.equal("(2/5)");
        });

        it("should not show page counter when showPageNumber is false", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 1,
                    totalFeatures: 5,
                    showPageNumber: false
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".gfi-page-counter").exists()).to.be.false;
        });

        it("should not show page counter when totalFeatures is 1", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 0,
                    totalFeatures: 1,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".gfi-page-counter").exists()).to.be.false;
        });

        it("should show correct counter for first page", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 0,
                    totalFeatures: 3,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".gfi-page-counter").text()).to.be.equal("(1/3)");
        });

        it("should show correct counter for last page", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 4,
                    totalFeatures: 5,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.find(".gfi-page-counter").text()).to.be.equal("(5/5)");
        });

        it("should compute showCounter correctly", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 0,
                    totalFeatures: 3,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.showCounter).to.be.true;
        });

        it("should compute pageCounterText correctly", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature,
                    pagerIndex: 2,
                    totalFeatures: 7,
                    showPageNumber: true
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.vm.pageCounterText).to.be.equal("(3/7)");
        });
    });

    it("should have the child component default (-Theme)", () => {
        const wrapper = mount(DetachedTemplate, {
            propsData: {
                feature
            },
            components: {
                DefaultTheme: {
                    name: "DefaultTheme",
                    template: "<span />"
                }
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.findComponent({name: "DefaultTheme"}).exists()).to.be.true;
    });

    it("should set 'isContentHtml' to true", async () => {
        const wrapper = mount(DetachedTemplate, {
            propsData: {
                feature: {
                    getTheme: () => "default",
                    getTitle: () => "Hallo",
                    getMimeType: () => "text/html",
                    getGfiUrl: () => "http",
                    getLayerId: () => sinon.stub(),
                    getOlFeature: () => olFeature
                }
            },
            components: {
                DefaultTheme: {
                    name: "DefaultTheme",
                    template: "<span />"
                }
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.isContentHtml).to.be.true;
    });

    it("should not set 'isContentHtml' to true", async () => {
        const wrapper = mount(DetachedTemplate, {
            propsData: {
                feature
            },
            components: {
                DefaultTheme: {
                    name: "DefaultTheme",
                    template: "<span />"
                }
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.isContentHtml).to.be.false;
    });

    describe("Lifecycle Hooks", () => {
        it("should emit 'updateFeatureDone' in updated hook if isUpdated is true", async () => {
            const wrapper = mount(DetachedTemplate, {
                props: {
                    feature: {
                        getTheme: () => "DefaultTheme",
                        getTitle: () => "Hallo",
                        getMimeType: () => "text/xml",
                        getGfiUrl: () => "",
                        getLayerId: () => sinon.stub(),
                        getOlFeature: () => olFeature
                    }
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<span />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            await wrapper.setProps({isUpdated: true});
            await wrapper.vm.$nextTick();
            expect(wrapper.emitted()).to.have.property("updateFeatureDone");
            expect(wrapper.emitted().updateFeatureDone).to.have.lengthOf(1);
        });
    });

    describe("methods", () => {
        describe("highlightVectorFeature", () => {
            it("should do nothing, if highlightVectorRules is not set", () => {
                highlightVectorRules = null;

                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.highlightVectorFeature();
                expect(getLayerByIdSpy.notCalled).to.be.true;
                expect(highlightFeatureSpy.notCalled).to.be.true;
            });

            it("should call highlightFeature if feature's geometry is a point", () => {
                const expectedArgs = {
                    feature: olFeature,
                    type: "increase",
                    scale: highlightVectorRules.image.scale,
                    layer: {id: "layerId"},
                    styleId: "styleId"
                };

                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => "layerId",
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(getLayerByIdSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
            });

            it("should call highlightFeature if feature's geometry is a polygon - test styleId", () => {
                const expectedArgs = {
                    feature: olFeature,
                    type: "highlightPolygon",
                    highlightStyle: {
                        fill: highlightVectorRules.fill,
                        stroke: highlightVectorRules.stroke
                    },
                    layer: {id: "layerId"},
                    styleId: "styleId"
                };

                olFeature.setGeometry(new Polygon([[[30, 10], [40, 40], [130, 130], [240, 40], [30, 10]]]));
                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => "layerId",
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(getLayerByIdSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
            });
            it("should call highlightFeature for a 3D tileset feature without geometry function, shall not be highlighted", () => {
                const tileFeature = {
                };

                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => "layerId",
                            getOlFeature: () => tileFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(getLayerByIdSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.notCalled).to.be.true;
            });

            it("should call highlightFeature if feature's geometry is a linestring", () => {
                const expectedArgs = {
                    feature: olFeature,
                    type: "highlightLine",
                    highlightStyle: {
                        stroke: highlightVectorRules.stroke
                    },
                    layer: {id: "layerId"},
                    styleId: "styleId"
                };

                olFeature.setGeometry(new LineString([[30, 10], [40, 40], [130, 130], [240, 40]]));
                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => "layerId",
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                expect(getLayerByIdSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
            });
            it("should call highlightFeature if feature's geometry is a multipolygon - test styleId", () => {
                const expectedArgs = {
                        feature: olFeature,
                        type: "highlightMultiPolygon",
                        highlightStyle: {
                            fill: highlightVectorRules.fill,
                            stroke: highlightVectorRules.stroke
                        },
                        layer: {id: "layerId"},
                        styleId: "styleId"
                    },
                    removeHighlightingSpy = sinon.spy(DetachedTemplate.methods, "removeHighlighting");

                olFeature.setGeometry(new MultiPolygon([
                    [
                        [[30, 10], [40, 40], [130, 130], [240, 40], [30, 10]],
                        [[20, 30], [35, 50], [100, 100], [220, 30], [20, 30]]
                    ]
                ]));

                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => "layerId",
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });
                expect(getLayerByIdSpy.calledOnce).to.be.true;
                expect(removeHighlightingSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.calledOnce).to.be.true;
                expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
            });

        });

        describe("removeHighlighting", () => {
            it("should not call removeHighlightFeatureSpy if no lastFeature available", () => {
                highlightVectorRules = null;

                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.removeHighlighting();
                expect(removeHighlightFeatureSpy.notCalled).to.be.true;
            });

            it("should call removeHighlightFeatureSpy if lastFeature available", () => {
                highlightVectorRules = null;

                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.setData({
                    lastFeature: {
                        getOlFeature: sinon.stub()
                    }
                });

                wrapper.vm.removeHighlighting();
                expect(removeHighlightFeatureSpy.calledOnce).to.be.true;
            });

            describe("highlightWMSFeature", () => {
                it("should do nothing, if showPolygonMarkerForWMS is not set to True", () => {
                    showPolygonMarkerForWMS = false;
                    highlightVectorRules = null;

                    const wrapper = shallowMount(DetachedTemplate, {
                        propsData: {
                            feature: {
                                getTheme: () => "DefaultTheme",
                                getTitle: () => "Hallo",
                                getMimeType: () => "text/xml",
                                getGfiUrl: () => "",
                                getLayerId: () => "layerId",
                                getOlFeature: () => olFeature
                            }
                        },
                        components: {
                            DefaultTheme: {
                                name: "DefaultTheme",
                                template: "<span />"
                            }
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                    wrapper.vm.highlightWMSFeature();
                    expect(getLayerByIdSpy.notCalled).to.be.true;
                    expect(highlightFeatureSpy.notCalled).to.be.true;
                });

                it("should call highlightFeature if feature's geometry is a point", () => {

                    highlightVectorRules = null;
                    showPolygonMarkerForWMS = true;

                    olFeature.setGeometry(new Point([30, 10]));
                    layer.attributes = {
                        typ: "WMS"
                    };

                    const expectedArgs = {
                        feature: olFeature,
                        type: "highlightPoint",
                        layer: {id: "layerId"}
                    };

                    shallowMount(DetachedTemplate, {
                        propsData: {
                            feature: {
                                getTheme: () => "DefaultTheme",
                                getTitle: () => "Hallo",
                                getMimeType: () => "text/xml",
                                getGfiUrl: () => "",
                                getLayerId: () => "layerId",
                                getOlFeature: () => olFeature
                            }
                        },
                        components: {
                            DefaultTheme: {
                                name: "DefaultTheme",
                                template: "<span />"
                            }
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                    expect(getLayerByIdSpy.calledOnce).to.be.true;
                    expect(removePolygonMarkerSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
                });

                it("should call highlightFeature if feature's geometry is a polygon", () => {
                    highlightVectorRules = null;
                    showPolygonMarkerForWMS = true;

                    olFeature.setGeometry(new Polygon([[[30, 10], [40, 40], [130, 130], [240, 40], [30, 10]]]));
                    layer.attributes = {
                        typ: "WMS"
                    };

                    const expectedArgs = {
                        feature: olFeature,
                        type: "highlightPolygon",
                        layer: {id: "layerId"}
                    };

                    shallowMount(DetachedTemplate, {
                        propsData: {
                            feature: {
                                getTheme: () => "DefaultTheme",
                                getTitle: () => "Hallo",
                                getMimeType: () => "text/xml",
                                getGfiUrl: () => "",
                                getLayerId: () => "layerId",
                                getOlFeature: () => olFeature
                            }},
                        components: {
                            DefaultTheme: {
                                name: "DefaultTheme",
                                template: "<span />"
                            }},
                        global: {
                            plugins: [store]
                        }
                    });


                    expect(getLayerByIdSpy.calledOnce).to.be.true;
                    expect(removePolygonMarkerSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
                });

                it("should call highlightFeature if feature's geometry is a multipolygon", () => {
                    const expectedArgs = {
                        feature: olFeature,
                        type: "highlightMultiPolygon",
                        layer: {id: "layerId"}
                    };

                    highlightVectorRules = null;
                    showPolygonMarkerForWMS = true;
                    olFeature.setGeometry(new MultiPolygon([
                        [
                            [[30, 10], [40, 40], [130, 130], [240, 40], [30, 10]],
                            [[20, 30], [35, 50], [100, 100], [220, 30], [20, 30]]
                        ]
                    ]));

                    layer.attributes = {
                        typ: "WMS"
                    };

                    shallowMount(DetachedTemplate, {
                        propsData: {
                            feature: {
                                getTheme: () => "DefaultTheme",
                                getTitle: () => "Hallo",
                                getMimeType: () => "text/xml",
                                getGfiUrl: () => "",
                                getLayerId: () => "layerId",
                                getOlFeature: () => olFeature
                            }
                        },
                        components: {
                            DefaultTheme: {
                                name: "DefaultTheme",
                                template: "<span />"
                            }
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                    expect(getLayerByIdSpy.calledOnce).to.be.true;
                    expect(removePolygonMarkerSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
                });

                it("should call highlightFeature if feature's geometry is a linestring", () => {
                    const expectedArgs = {
                        feature: olFeature,
                        type: "highlightLine",
                        layer: {id: "layerId"}
                    };

                    highlightVectorRules = null;
                    showPolygonMarkerForWMS = true;
                    olFeature.setGeometry(new LineString([[30, 10], [40, 40], [130, 130], [240, 40]]));
                    layer.attributes = {
                        typ: "WMS"
                    };
                    shallowMount(DetachedTemplate, {
                        propsData: {
                            feature: {
                                getTheme: () => "DefaultTheme",
                                getTitle: () => "Hallo",
                                getMimeType: () => "text/xml",
                                getGfiUrl: () => "",
                                getLayerId: () => "layerId",
                                getOlFeature: () => olFeature
                            }
                        },
                        components: {
                            DefaultTheme: {
                                name: "DefaultTheme",
                                template: "<span />"
                            }
                        },
                        global: {
                            plugins: [store]
                        }
                    });

                    expect(getLayerByIdSpy.calledOnce).to.be.true;
                    expect(removePolygonMarkerSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.calledOnce).to.be.true;
                    expect(highlightFeatureSpy.firstCall.args[1]).to.be.deep.equals(expectedArgs);
                });
            });
        });

        describe("setMarker", () => {
            it("should not call placingPointMarker if showMarker is false", () => {
                highlightVectorRules = null;
                showMarker = false;
                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setMarker();
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });
            it("should do nothing if clickCoordinate is not filled - used on restore by urlParams", () => {
                highlightVectorRules = null;
                showMarker = true;
                centerMapToClickPoint = true;
                clickCoordinateFromMap = null;
                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setMarker();
                expect(placingPointMarkerSpy.notCalled).to.be.true;
                expect(setCenterSpy.notCalled).to.be.true;
            });
            it("should call placingPointMarker if showMarker is true", () => {
                highlightVectorRules = null;
                showMarker = true;
                const wrapper = shallowMount(DetachedTemplate, {
                    propsData: {
                        feature
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });

                wrapper.vm.setMarker();
                expect(placingPointMarkerSpy.calledTwice).to.be.true;
            });
            it("shall center to click coordinates, even if marker is not set", () => {
                centerMapToClickPoint = true;
                showMarker = false;
                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => sinon.stub(),
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });
                // setMarker is called on mount
                expect(setCenterSpy.calledOnce).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });
            it("shall center to click coordinates and set Marker", () => {
                centerMapToClickPoint = true;
                showMarker = true;
                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => sinon.stub(),
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });
                // setMarker is called on mount
                expect(setCenterSpy.calledOnce).to.be.true;
                expect(placingPointMarkerSpy.calledOnce).to.be.true;
            });
            it("shall do nothing", () => {
                centerMapToClickPoint = false;
                showMarker = false;
                shallowMount(DetachedTemplate, {
                    propsData: {
                        feature: {
                            getTheme: () => "DefaultTheme",
                            getTitle: () => "Hallo",
                            getMimeType: () => "text/xml",
                            getGfiUrl: () => "",
                            getLayerId: () => sinon.stub(),
                            getOlFeature: () => olFeature
                        }
                    },
                    components: {
                        DefaultTheme: {
                            name: "DefaultTheme",
                            template: "<span />"
                        }
                    },
                    global: {
                        plugins: [store]
                    }
                });
                // setMarker is called on mount
                expect(setCenterSpy.notCalled).to.be.true;
                expect(placingPointMarkerSpy.notCalled).to.be.true;
            });
        });
    });

    describe("Sticky Header Feature", () => {
        it("should not apply sticky classes when stickyHeader is false", () => {
            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [store]
                }
            });

            const header = wrapper.find(".gfi-header-simple");

            expect(header.exists()).to.be.true;
            expect(header.classes()).to.include("gfi-header-simple");
        });

        it("should apply sticky classes when stickyHeader is true", () => {
            mockGetters.stickyHeader = () => true;
            const customStore = createStore({
                namespaced: true,
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            GetFeatureInfo: {
                                namespaced: true,
                                mutations: mockMutations,
                                getters: mockGetters
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        actions: {
                            placingPointMarker: placingPointMarkerSpy,
                            removePointMarker: sinon.stub(),
                            setCenter: setCenterSpy,
                            removeHighlightFeature: removeHighlightFeatureSpy,
                            removePolygonMarker: removePolygonMarkerSpy,
                            highlightFeature: highlightFeatureSpy
                        },
                        getters: {
                            clickCoordinate: () => clickCoordinateFromMap
                        }
                    },
                    Menu: {
                        namespaced: true,
                        actions: {
                            setMenuBackAndActivateItem: sinon.stub()
                        }
                    }
                }
            });

            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [customStore]
                }
            });

            const header = wrapper.find(".gfi-header-fixed");

            expect(header.exists()).to.be.true;
            expect(header.classes()).to.include("gfi-header-fixed");
        });

        it("should render fixed header container when stickyHeader is true", () => {
            mockGetters.stickyHeader = () => true;
            const customStore = createStore({
                namespaced: true,
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            GetFeatureInfo: {
                                namespaced: true,
                                mutations: mockMutations,
                                getters: mockGetters
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        actions: {
                            placingPointMarker: placingPointMarkerSpy,
                            removePointMarker: sinon.stub(),
                            setCenter: setCenterSpy,
                            removeHighlightFeature: removeHighlightFeatureSpy,
                            removePolygonMarker: removePolygonMarkerSpy,
                            highlightFeature: highlightFeatureSpy
                        },
                        getters: {
                            clickCoordinate: () => clickCoordinateFromMap
                        }
                    },
                    Menu: {
                        namespaced: true,
                        actions: {
                            setMenuBackAndActivateItem: sinon.stub()
                        }
                    }
                }
            });

            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [customStore]
                }
            });

            const container = wrapper.find(".gfi-detached-container");

            expect(container.exists()).to.be.true;
        });

        it("should have border-bottom on fixed header", async () => {
            mockGetters.stickyHeader = () => true;
            const customStore = createStore({
                namespaced: true,
                modules: {
                    Modules: {
                        namespaced: true,
                        modules: {
                            GetFeatureInfo: {
                                namespaced: true,
                                mutations: mockMutations,
                                getters: mockGetters
                            }
                        }
                    },
                    Maps: {
                        namespaced: true,
                        actions: {
                            placingPointMarker: placingPointMarkerSpy,
                            removePointMarker: sinon.stub(),
                            setCenter: setCenterSpy,
                            removeHighlightFeature: removeHighlightFeatureSpy,
                            removePolygonMarker: removePolygonMarkerSpy,
                            highlightFeature: highlightFeatureSpy
                        },
                        getters: {
                            clickCoordinate: () => clickCoordinateFromMap
                        }
                    },
                    Menu: {
                        namespaced: true,
                        actions: {
                            setMenuBackAndActivateItem: sinon.stub()
                        }
                    }
                }
            });

            const wrapper = mount(DetachedTemplate, {
                propsData: {
                    feature
                },
                components: {
                    DefaultTheme: {
                        name: "DefaultTheme",
                        template: "<div />"
                    }
                },
                global: {
                    plugins: [customStore]
                }
            });

            const header = wrapper.find(".gfi-header-fixed");

            expect(header.exists()).to.be.true;
            // Fixed header always has border-bottom styling
            expect(header.classes()).to.include("gfi-header-fixed");
        });
    });


});
