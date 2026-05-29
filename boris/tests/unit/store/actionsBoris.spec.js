import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsBoris.js";
import stateBoris from "../../../store/stateBoris.js";
import axios from "axios";
import mapCollection from "../../../../../src/core/maps/js/mapCollection.js";
import rawSources from "../../resources/rawSources.js";
import layerCollection from "../../../../../src/core/layers/js/layerCollection.js";

import {addProjection} from "ol/proj.js";
import Projection from "ol/proj/Projection.js";


describe("ADDONS: addons/boris/store/actionsBoris.js", () => {
    const layer1 = {
            name: "Layer1",
            id: "1",
            gfiAttributes: "ignore"
        },
        layer2 = {
            name: "Layer2",
            id: "2",
            gfiAttributes: ""
        },
        layer3 = {
            name: "Layer3",
            id: "3",
            gfiAttributes: ""
        };
    let commit,
        dispatch,
        getters,
        rootState,
        rootGetters,
        state,
        map = null,
        error,
        axiosGetStub,
        axiosPostStub;

    beforeAll(() => {
        const proj = new Projection({
            code: "EPSG:25832",
            units: "m",
            axisOrientation: "enu",
            global: false
        });

        addProjection(proj);

        map = {
            id: "ol",
            mode: "2D",
            getView: () => {
                return {
                    getResolution: () => {
                        return "0.6614579761460262";
                    },
                    getProjection: () => {
                        return {"axisOrientation_": "enu",
                            "canWrapX_": false,
                            "code_": "EPSG:25832",
                            "defaultTileGrid_": null,
                            "extent_": null,
                            "getPointResolutionFunc_": undefined,
                            "global_": false,
                            "metersPerUnit_": undefined,
                            "units_": "m",
                            "worldExtent_": null};
                    }
                };
            }
        };
        mapCollection.clear();
        mapCollection.addMap(map, "2D");
    });

    beforeEach(() => {
        commit = sinon.spy();
        dispatch = sinon.stub().resolves(true);
        getters = sinon.stub();
        rootState = {
            Maps: {
                mode: "2D"
            },
            urlParams: {
                "BRWID": "01510241",
                "BRWLAYERNAME": "31.12.2017",
                "CENTER": [565774, 5933956]
            }
        };
        rootGetters = {
            "Maps/clickCoordinate": [0, 0],
            layerConfigsByAttributes: ()=> [layer1, layer2, layer3]
        };
        state = {...stateBoris};
        error = sinon.spy();
        sinon.stub(console, "error").callsFake(error);
        sinon.stub(console, "warn").callsFake(sinon.spy());

        const attribute1 = {
                "name": "31.12.2022",
                "isNeverVisibleInTree": true,
                visibility: true,
                "typ": "WMS",
                "layers": "v_brw_zonen_geom_flaeche_2022",
                id: 123
            },
            attribute2 = {
                "name": "31.12.2020",
                "isNeverVisibleInTree": true,
                visibility: false,
                "typ": "WMS",
                "layers": "v_brw_zonen_geom_flaeche_2020"
            };

        state.filteredLayerList = [
            attribute1,
            attribute2
        ];
        axiosGetStub = sinon.stub(axios, "get").resolves({status: 200, data: {}});
        axiosPostStub = sinon.stub(axios, "post").resolves({status: 200, data: {}});
    });


    describe("initialize", () => {
        it("initializes the layerlist ", () => {
            let resultArray = [];

            actions.initialize({commit, rootGetters});
            resultArray = commit.args[0][1];

            expect(commit.calledOnce).to.be.true;
            expect(commit.args[0][0]).to.equal("setFilteredLayerList");
            expect(resultArray[1]).to.deep.equal(layer2);
            expect(resultArray).to.deep.equal([layer1, layer2, layer3]);
        });
    });
    describe("handleUrlParameters", () => {
        it("handles URL parameters", async () => {
            dispatch.withArgs("switchLayer", rootState.urlParams.BRWLAYERNAME).resolves();
            dispatch.withArgs("Maps/setCenter", rootState.urlParams["Maps/center"]).resolves();
            dispatch.withArgs("requestGFI", {processFromParametricUrl: true, center: rootState.urlParams["Maps/center"]}).resolves();

            await actions.handleUrlParameters({rootState, commit, dispatch});

            expect(dispatch.calledThrice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setIsProcessFromParametricUrl");
            expect(commit.firstCall.args[1]).to.equal(true);
            expect(commit.secondCall.args[0]).to.equal("setParamUrlParams");
            expect(commit.secondCall.args[1].brwId).to.equal(rootState.urlParams.BRWID);
            expect(commit.secondCall.args[1].brwLayerName).to.equal(rootState.urlParams.BRWLAYERNAME);
            expect(commit.secondCall.args[1].center).to.deep.equal(rootState.urlParams.CENTER);
            expect(commit.thirdCall.args[0]).to.equal("setSelectedLayerName");
            expect(commit.thirdCall.args[1]).to.equal(rootState.urlParams.BRWLAYERNAME);
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("switchLayer");
            expect(dispatch.firstCall.args[1]).to.equal(rootState.urlParams.BRWLAYERNAME);
            expect(dispatch.secondCall.args[0]).to.equal("Maps/setCenter");
            expect(dispatch.secondCall.args[1]).to.deep.equal(rootState.urlParams.CENTER, {root: true});
            expect(dispatch.thirdCall.args[0]).to.equal("requestGFI");
            expect(dispatch.thirdCall.args[1].undefined).to.equal(undefined);
            expect(dispatch.thirdCall.args[1].processFromParametricUrl).to.equal(true);
            expect(dispatch.thirdCall.args[1].center).to.deep.equal(rootState.urlParams.CENTER);
        });
        it("do not handle url parameters", async () => {
            rootState.urlParams = {};
            await actions.handleUrlParameters({rootState, commit, dispatch});
            expect(commit.notCalled).to.be.true;
        });
    });
    describe("simulateLanduseSelect", () => {
        it("simulates landuse selection for paramURL", () => {
            getters.findLanduseByBrwId = "BH Bürohäuser";

            actions.simulateLanduseSelect({commit, getters});
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedLanduse");
            expect(commit.firstCall.args[1]).to.equal(getters.findLanduseByBrwId);
            expect(commit.secondCall.args[0]).to.equal("setIsProcessFromParametricUrl");
            expect(commit.secondCall.args[1]).to.equal(false);

        });
    });
    describe("switchLayer", () => {
        it("handles layer switch for area to stripes layer", () => {
            const selectedLayerName = "31.12.2017",
                layer = {
                    layerConfigs: [{
                        id: 123,
                        layer: {
                            id: 123,
                            visibility: false
                        }
                    }]
                };

            state.selectedLayer = state.filteredLayerList.attribute1;

            actions.switchLayer({rootGetters, state, dispatch, commit}, selectedLayerName);

            expect(commit.callCount).to.equal(2);
            expect(commit.args[0][0]).to.equal("setSelectedLayerName");
            expect(commit.args[0][1]).to.equal(selectedLayerName);
            expect(commit.args[1][0]).to.equal("setIsAreaLayer");
            expect(commit.args[1][1]).to.equal(false);
            expect(dispatch.callCount).to.equal(4);
            expect(dispatch.args[0][0]).to.equal("replaceByIdInLayerConfig");
            expect(dispatch.args[0][1]).to.deep.equal(layer);
            expect(dispatch.args[1][0]).to.equal("selectLayerByName");
            expect(dispatch.args[1][1]).to.equal(selectedLayerName);
            expect(dispatch.args[2][0]).to.equal("requestGFI");
            expect(dispatch.args[2][1]).to.deep.equal({processFromParametricUrl: false, center: null});
            expect(dispatch.args[3][0]).to.equal("toggleStripesLayer");
            expect(dispatch.args[3][1]).to.equal(false);

        });
        it("handles layer switch for stripes to point layer", () => {
            const selectedLayerName = "31.12.2006",
                attribute1 = {
                    "name": "31.12.2017",
                    "isSelected": true,
                    "isVisibleInMap": false,
                    id: 123
                };

            state.filteredLayerList = [
                {
                    "attributes": attribute1,
                    get: (key)=> {
                        return attribute1[key];
                    },
                    set: (key, value) => {
                        attribute1[key] = value;
                    }
                }];

            state.selectedLayer = state.filteredLayerList.attribute1;

            actions.switchLayer({rootGetters, state, dispatch, commit}, selectedLayerName);
            expect(commit.callCount).to.equal(2);
            expect(commit.args[0][0]).to.equal("setSelectedLayerName");
            expect(commit.args[0][1]).to.equal(selectedLayerName);
            expect(commit.args[1][0]).to.equal("setIsAreaLayer");
            expect(commit.args[1][1]).to.equal(false);
            expect(dispatch.callCount).to.equal(4);
            expect(dispatch.args[0][0]).to.equal("selectLayerByName");
            expect(dispatch.args[0][1]).to.equal(selectedLayerName);
            expect(dispatch.args[1][0]).to.equal("Maps/removePolygonMarker");
            expect(dispatch.args[1][1]).to.equal(null);
            expect(dispatch.args[2][0]).to.equal("requestGFI");
            expect(dispatch.args[3][0]).to.equal("toggleStripesLayer");
            expect(dispatch.args[3][1]).to.equal(false);
        });
        it("handles layer switch for area to area layer", () => {
            const selectedLayerName = "31.12.2020",
                layer = {
                    layerConfigs: [{
                        id: 123,
                        layer: {
                            id: 123,
                            visibility: false
                        }
                    }]
                };

            state.selectedLayer = state.filteredLayerList[1];

            actions.switchLayer({rootGetters, state, dispatch, commit}, selectedLayerName);
            expect(commit.calledTwice).to.be.true;
            expect(dispatch.callCount).to.equal(4);
            expect(commit.args[1][0]).to.equal("setIsAreaLayer");
            expect(commit.args[1][1]).to.equal(true);
            expect(dispatch.args[0][0]).to.equal("replaceByIdInLayerConfig");
            expect(dispatch.args[0][1]).to.deep.equal(layer);
            expect(dispatch.args[1][0]).to.equal("selectLayerByName");
            expect(dispatch.args[2][0]).to.equal("requestGFI");
            expect(dispatch.args[3][0]).to.equal("toggleStripesLayer");
        });
        it("handles layer switch for point to stripes layer", () => {
            const selectedLayerName = "31.12.2018",
                attribute1 = {
                    "name": "01.01.2000",
                    "isSelected": true,
                    "isVisibleInMap": false
                };

            state.filteredLayerList = [
                {
                    "attributes": attribute1,
                    get: (key)=> {
                        return attribute1[key];
                    },
                    set: (key, value) => {
                        attribute1[key] = value;
                    }
                }];

            state.selectedLayer = state.filteredLayerList.attribute1;

            actions.switchLayer({rootGetters, state, dispatch, commit}, selectedLayerName);
            expect(commit.callCount).to.equal(4);
            expect(commit.args[1][0]).to.equal("setSelectedBrwFeature");
            expect(commit.args[1][1]).to.deep.equal({});
            expect(commit.args[2][0]).to.equal("setTextIds");
            expect(commit.args[2][1]).to.deep.equal([]);
            expect(commit.args[3][0]).to.equal("setIsAreaLayer");
            expect(commit.args[3][1]).to.equal(false);
            expect(dispatch.callCount).to.equal(4);
            expect(dispatch.args[1][0]).to.equal("requestGFI");
            expect(dispatch.args[2][0]).to.equal("Maps/removePointMarker");
            expect(dispatch.args[3][0]).to.equal("toggleStripesLayer");
            expect(dispatch.args[3][1]).to.equal(false);
        });
    });
    describe("toggleStripesLayer", () => {

        it("show stripes layer", () => {
            const value = true,
                layerName = state.filteredLayerList[0].name + "-stripes";

            actions.toggleStripesLayer({state, dispatch, commit}, value);

            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setIsStripesLayer");
            expect(commit.firstCall.args[1]).to.equal(value);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("selectLayerByName");
            expect(dispatch.firstCall.args[1]).to.equal(layerName);
        });
        it("hide stripes layer", () => {
            const value = false;

            actions.toggleStripesLayer({state, dispatch, commit}, value);
            expect(commit.calledOnce).to.be.true;
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setIsStripesLayer");
            expect(commit.firstCall.args[1]).to.equal(value);
            expect(dispatch.calledOnce).to.be.false;
        });
    });
    describe("selectLayerByName", () => {

        it("selectLayerByName", () => {
            const selectedLayerName = "31.12.2022";

            actions.selectLayerByName({state, commit}, selectedLayerName);
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedLayer");
            expect(commit.firstCall.args[1]).to.equal(state.filteredLayerList[0]);
        });
    });
    describe("requestGFI", () => {
        it("requests GFI", async () => {
            sinon.stub(layerCollection, "getLayerById").returns({
                layerSource: {
                    getFeatureInfoUrl: () => {
                        return "https://geodienste.hamburg.de/HH_WMS_Bodenrichtwerte?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=v_brw_zonen_geom_flaeche_2022&CACHEID=5781983&LAYERS=v_brw_zonen_geom_flaeche_2022&SINGLETILE=false&WIDTH=512&HEIGHT=512&I=508&J=91&CRS=EPSG%3A25832&STYLES=&BBOX=565397.2671308091%2C5933629.266033529%2C565735.9336145959%2C5933967.932517316";
                    }
                }
            });
            state.active = true;
            axiosGetStub.resolves({status: 200});

            const url = layerCollection.getLayerById().layerSource.getFeatureInfoUrl();

            await actions.requestGFI({rootGetters, state, dispatch}, {processFromParametricUrl: "", center: ""});
            expect(axiosGetStub.calledWith(url)).to.be.true;
        });
    });
    describe("handleGfiResponse", () => {
        it("handles GFI response features from year 2008", () => {
            const response = rawSources.gfiResponseNewer,
                coordinate = [565867.1504386466, 5933871.340649964];

            actions.handleGfiResponse({state, dispatch, commit}, {response, coordinate});
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedPolygon");
            expect(commit.firstCall.args[1]).to.not.equal(null);
            expect(dispatch.calledTwice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("getFeatureRequestById");
            expect(dispatch.secondCall.args[0]).to.equal("matchPolygonFeatureWithLanduse");
        });
        it("handles GFI response features until year 2008", () => {
            const response = rawSources.gfiResponseOlder,
                status = 200,
                coordinate = [565842.6764935291, 5933973.469777631];

            actions.handleGfiResponse({state, dispatch, commit}, {response, status, coordinate});
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setBrwFeatures");
            expect(commit.firstCall.args[1]).not.to.equal(null);
            expect(commit.secondCall.args[0]).to.equal("setSelectedPolygon");
            expect(commit.secondCall.args[1]).to.equal(null);
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Maps/placingPointMarker");
            expect(dispatch.firstCall.args[1]).to.equal(coordinate);
            expect(dispatch.secondCall.args[0]).to.equal("Maps/setCenter");
            expect(dispatch.secondCall.args[1]).to.equal(coordinate);
            expect(dispatch.thirdCall.args[0]).to.equal("combineFeatureWithSelectedDate");
            expect(dispatch.thirdCall.args[1]).not.to.equal(null);
        });
        it("does not handle GFI response", () => {
            const response = null,
                status = 200,
                coordinate = [];

            actions.handleGfiResponse({state, dispatch, commit}, {response, status, coordinate});
            expect(dispatch.calledThrice).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
            expect(dispatch.secondCall.args[0]).to.equal("Maps/removePolygonMarker");
            expect(dispatch.thirdCall.args[0]).to.equal("Maps/removePointMarker");
            expect(commit.callCount).to.equal(5);
            expect(commit.firstCall.args[0]).to.equal("setSelectedBrwFeature");
            expect(commit.firstCall.args[1]).to.deep.equal({});
            expect(commit.secondCall.args[0]).to.equal("setSelectedPolygon");
            expect(commit.secondCall.args[1]).to.deep.equal(null);
            expect(commit.thirdCall.args[0]).to.equal("setSelectedLanduse");
            expect(commit.thirdCall.args[1]).to.deep.equal("");
            expect(commit.args[4][0]).to.equal("Maps/setClickCoordinate");
        });
    });
    describe("getFeatureRequestById", () => {
        it("gets feature request by id", async () => {
            Config.layerConf = "https://geodienste.hamburg.de/services-internet.json";

            const featureId = "APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260",
                featureYear = "2022",
                url = "https://geodienste.hamburg.de",
                urlParams = "typeNameapp:v_brw_zonen_geom_flaeche_2022&featureID=APP_V_BRW_ZONEN_GEOM_FLAECHE_2022_1393260",
                responseData = rawSources.featureRequestResponse;

            axiosGetStub.resolves({status: 200, data: responseData});

            await actions.getFeatureRequestById({dispatch}, {featureId, featureYear});
            expect(axiosGetStub.calledWith(url + "/HH_WFS_Bodenrichtwerte?service=WFS&version=1.1.0&request=GetFeature&" + urlParams)).to.be.true;
        });
    });
    describe("matchPolygonFeatureWithLanduse", () => {
        it("matches polygon feature with selected landuse", () => {
            const attribute = {
                    jahrgang: 2022,
                    nutzungsart: [
                        {
                            nutzungsart: "A Acker",
                            richtwertnummer: "09110239"
                        },
                        {
                            nutzungsart: "GR Grünland",
                            richtwertnummer: "09210239"
                        },
                        {
                            nutzungsart: "EGA Erwerbsgartenanbaufläche",
                            richtwertnummer: "09310239"
                        }
                    ]},
                feature = {
                    attribute: attribute,
                    get: (key) => {
                        return attribute[key];
                    }
                },
                selectedLanduse = "A Acker";

            actions.matchPolygonFeatureWithLanduse({dispatch, commit}, {feature, selectedLanduse});
            expect(dispatch.calledOnce).to.be.true;
        });
        it("does not match polygon feature with selected landuse", () => {
            const attribute = {
                    jahrgang: 2022,
                    nutzungsart: [
                        {
                            nutzungsart: "A Acker",
                            richtwertnummer: "09110239"
                        },
                        {
                            nutzungsart: "GR Grünland",
                            richtwertnummer: "09210239"
                        },
                        {
                            nutzungsart: "EGA Erwerbsgartenanbaufläche",
                            richtwertnummer: "09310239"
                        }
                    ]},
                feature = {
                    attribute: attribute,
                    get: (key) => {
                        return attribute[key];
                    }
                },
                selectedLanduse = "B Acker";

            actions.matchPolygonFeatureWithLanduse({dispatch, commit}, {feature, selectedLanduse});
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedLanduse");
            expect(commit.firstCall.args[1]).to.equal("");
            expect(commit.secondCall.args[0]).to.equal("setSelectedBrwFeature");
            expect(commit.secondCall.args[1]).to.deep.equal({});
        });
    });
    describe("postFeatureRequestByBrwNumber", () => {
        it("posts feature request", async () => {
            Config.layerConf = "https://geodienste.hamburg.de/services-fhhnet-ALL.json";

            const brwNumber = "09310239",
                featureYear = "2022";

            axiosPostStub.resolves({status: 200});

            await actions.postFeatureRequestByBrwNumber({dispatch}, {brwNumber, featureYear});
            expect(axiosPostStub.called).to.be.true;
        });
    });
    describe("handleGetFeatureResponse", () => {
        it("handles feature response", async () => {

            const status = 200,
                response = rawSources.featureRequestResponse,
                year = 2022;

            await actions.handleGetFeatureResponse({dispatch, commit}, {response, status, year});

            expect(commit.calledOnce).to.be.true;
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("combineFeatureWithSelectedDate");

        });
    });
    describe("combineFeatureWithSelectedDate", () => {
        it("combines selected date with feature", async () => {
            const feature = {
                "anbauart": "undefined",
                "baublock": 12
            };

            await actions.combineFeatureWithSelectedDate({dispatch, getters}, feature);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("extendFeatureAttributes");
        });
        it("data quary failed by combining date with feature", async () => {
            const feature = undefined;

            await actions.combineFeatureWithSelectedDate({dispatch, getters}, feature);

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("Alerting/addSingleAlert");
        });
    });
    describe("extendFeatureAttributes", () => {
        it("get extended feature attributes", () => {
            const featureAttribute = {
                    jahrgang: 2022,
                    nutzungsart: [
                        {
                            nutzungsart: "A Acker",
                            richtwertnummer: "09110239"
                        }
                    ]},
                feature = {
                    attribute: featureAttribute,
                    get: (key) => {
                        return featureAttribute[key];
                    },
                    setProperties: (key, value) => {
                        featureAttribute.key = value;
                    }
                },
                date = "31.01.2022";

            actions.extendFeatureAttributes({dispatch, commit, state}, {feature, date});
            expect(commit.calledOnce).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedBrwFeature");
            expect(commit.firstCall.args[1]).to.equal(feature);
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("sendWpsConvertRequest");
            expect(dispatch.firstCall.args[1]).to.equal(state);

        });
    });
    describe("handleConvertResponse", () => {
        const response = rawSources.convertResponse;

        it("handles convert response", () => {
            const status = 200;

            actions.handleConvertResponse({dispatch}, {response, status});
            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.firstCall.args[0]).to.equal("updateSelectedBrwFeature");
        });
        it("console.error is being called", () => {
            const status = 404;

            actions.handleConvertResponse({dispatch}, {response, status});
            expect(console.error.calledOnce).to.be.true;
        });
    });
    describe("updateSelectedBrwFeature", () => {
        const attribute = {anbauart: "acker", jahrgang: 2022};

        it("updates selectedBrwFeature for contertedBrw", () => {
            const converted = "convertedBrw",
                brw = 2.8;

            state.selectedBrwFeature = {
                attribute: attribute,
                get: (key) => {
                    return attribute[key];
                },
                setProperties: (props) => {
                    Object.keys(props).forEach(key => {
                        const value = props[key];

                        attribute[key] = value;
                    });
                }
            };

            actions.updateSelectedBrwFeature({state, commit}, {converted, brw});
            expect(commit.calledTwice).to.be.true;
            expect(commit.firstCall.args[0]).to.equal("setSelectedBrwFeature");
            expect(commit.firstCall.args[1]).to.equal(state.selectedBrwFeature);
            expect(commit.secondCall.args[0]).to.equal("setConvertedBrw");
            expect(commit.secondCall.args[1]).to.equal(state.selectedBrwFeature.get("convertedBrw"));
            expect(state.selectedBrwFeature.attribute.convertedBrwDM).to.equal("");
            expect(state.selectedBrwFeature.attribute.convertedBrw).to.equal("2,8");

        });
        it("updates selectedBrwFeature for zStrassenLage", () => {
            const converted = "zStrassenLage",
                brw = 2.8;

            state.selectedBrwFeature = {
                attribute: attribute,
                get: (key) => {
                    return attribute[key];
                },
                setProperties: (props) => {
                    Object.keys(props).forEach(key => {
                        const value = props[key];

                        attribute[key] = value;
                    });
                }
            };
            actions.updateSelectedBrwFeature({state, commit}, {converted, brw});
            expect(state.selectedBrwFeature.attribute.zStrassenLage).to.equal(brw);
        });
    });
});

