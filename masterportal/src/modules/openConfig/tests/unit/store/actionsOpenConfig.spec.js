import {expect} from "chai";
import sinon from "sinon";
import actions from "@modules/openConfig/store/actionsOpenConfig.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import {treeTopicConfigKey, treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";

const {
    checkAvailabilityOfModules,
    processConfigJsonOnload
} = actions;


describe("src/modules/openConfig/store/actionsOpenConfig.js", () => {
    let clearSpy,
        commit,
        dispatch,
        map;

    beforeEach(() => {
        mapCollection.clear();

        commit = sinon.spy();
        dispatch = sinon.spy();
        clearSpy = sinon.spy(layerCollection, "clear");

        map = {
            id: "ol",
            mode: "2D",
            removeLayer: () => sinon.spy()
        };

        mapCollection.addMap(map, "2D");
        sinon.stub(console, "warn").callsFake(sinon.spy());

    });


    describe("processConfigJsonOnload", () => {
        it("should clear layerCollection, set portalConfig to the state and start extendLayers", () => {
            const event = {
                target: {
                    result: "{\r\n  \"portalConfig\": {},\r\n  \"" + treeTopicConfigKey + "\": {}\r\n}\r\n"
                }
            };

            processConfigJsonOnload({commit, dispatch}, {event, targetFileName: "config.json"});

            expect(clearSpy.calledOnce).to.be.true;

            expect(commit.calledThrice).to.be.true;
            expect(commit.firstCall.args[0]).to.equals("setPortalConfig");
            expect(commit.firstCall.args[1]).to.deep.equals({});

            expect(commit.secondCall.args[0]).to.equals("Menu/setSectionsBySide");
            expect(commit.secondCall.args[1]).to.deep.equals({
                "sections": [],
                "side": "mainMenu"
            }
            );
            expect(commit.thirdCall.args[0]).to.equals("Menu/setSectionsBySide");
            expect(commit.thirdCall.args[1]).to.deep.equals({
                "sections": [],
                "side": "secondaryMenu"
            }
            );
            expect(dispatch.callCount).to.be.equals(4);
            expect(dispatch.firstCall.args[0]).to.equals("extendLayers");
            expect(dispatch.firstCall.args[1]).to.equals(null);
            expect(dispatch.secondCall.args[0]).to.equals("checkAvailabilityOfModules");
            expect(dispatch.secondCall.args[1]).to.be.deep.equals({
                "menu": undefined,
                "notAvailableModules": []
            }
            );
            expect(dispatch.getCall(2).args[0]).to.equals("checkAvailabilityOfModules");
            expect(dispatch.getCall(2).args[1]).to.be.deep.equals({
                "menu": undefined,
                "notAvailableModules": []
            }
            );
            expect(dispatch.getCall(3).args[0]).to.equals("Alerting/addSingleAlert");
        });

        it("should clear layerCollection, set portalConfig, set Layerconfig to the state and start extendLayers", () => {
            const event = {
                    target: {
                        result: "{\r\n  \"portalConfig\": {\r\n    \"mainMenu\": {\r\n      \"sections\": [\r\n        [\r\n          {\r\n            \"type\": \"openConfig\"\r\n          }\r\n        ]\r\n      ]\r\n    },\r\n    \"secondaryMenu\": {\r\n      \"expanded\": false,\r\n      \"sections\": [\r\n        [\r\n          {\r\n            \"type\": \"shareView\"\r\n          }\r\n        ]\r\n      ]\r\n    }\r\n  },\r\n  \"" + treeTopicConfigKey + "\": {\r\n    \"" + treeBaselayersKey + "\": {\r\n      \"elements\": [\r\n          {\r\n              \"id\": \"453\",\r\n              \"name\": \"Geobasiskarten (HamburgDE)\",\r\n              \"typ\": \"WMS\",\r\n              \"visibility\": true\r\n          }\r\n      ]\r\n    },\r\n    \"" + treeSubjectsKey + "\": {\r\n      \"elements\": [\r\n        {\r\n          \"id\": \"10220\",\r\n          \"name\": \"Dauerzählstellen (Rad) Hamburg\",\r\n          \"typ\": \"WMS\",\r\n          \"visibility\": true\r\n        },\r\n        {\r\n          \"id\": \"2426\",\r\n          \"name\": \"Bezirke\",\r\n          \"typ\": \"WMS\",\r\n          \"visibility\": true\r\n        }\r\n      ]\r\n    }\r\n  }\r\n}\r\n"
                    }
                },
                menus = {
                    "mainMenu": {
                        "sections": [
                            [
                                {
                                    "type": "openConfig"
                                }
                            ]
                        ]
                    },
                    "secondaryMenu": {
                        "expanded": false,
                        "sections": [
                            [
                                {
                                    "type": "shareView"
                                }
                            ]
                        ]
                    }
                };

            processConfigJsonOnload({commit, dispatch}, {event, targetFileName: "config.json"});

            expect(clearSpy.calledOnce).to.be.true;

            expect(commit.callCount).to.be.equals(5);
            expect(commit.firstCall.args[0]).to.equals("setPortalConfig");
            expect(commit.firstCall.args[1]).to.deep.equals(menus);
            expect(commit.secondCall.args[0]).to.equals("setLayerConfigByParentKey");
            expect(commit.secondCall.args[1]).to.deep.equals({
                layerConfigs: {
                    "elements": [
                        {
                            "id": "453",
                            "name": "Geobasiskarten (HamburgDE)",
                            "typ": "WMS",
                            "visibility": true
                        }
                    ]
                },
                parentKey: treeBaselayersKey
            });
            expect(commit.thirdCall.args[0]).to.equals("setLayerConfigByParentKey");
            expect(commit.thirdCall.args[1]).to.deep.equals({
                layerConfigs: {
                    "elements": [
                        {
                            "id": "10220",
                            "name": "Dauerzählstellen (Rad) Hamburg",
                            "typ": "WMS",
                            "visibility": true
                        },
                        {
                            "id": "2426",
                            "name": "Bezirke",
                            "typ": "WMS",
                            "visibility": true
                        }
                    ]
                },
                parentKey: treeSubjectsKey
            });
            expect(commit.getCall(3).args[0]).to.equals("Menu/setSectionsBySide");
            expect(commit.getCall(3).args[1]).to.deep.equals({
                "sections": [[{"type": "openConfig"}]],
                "side": "mainMenu"
            }
            );
            expect(commit.getCall(4).args[0]).to.equals("Menu/setSectionsBySide");
            expect(commit.getCall(4).args[1]).to.deep.equals({
                "sections": [[{"type": "shareView"}]],
                "side": "secondaryMenu"
            }
            );
            expect(dispatch.callCount).to.be.equals(4);
            expect(dispatch.firstCall.args[0]).to.equals("extendLayers");
            expect(dispatch.firstCall.args[1]).to.equals(null);
            expect(dispatch.secondCall.args[0]).to.equals("checkAvailabilityOfModules");
            expect(dispatch.secondCall.args[1]).to.be.deep.equals({
                "menu": menus.mainMenu,
                "notAvailableModules": []
            }
            );
            expect(dispatch.getCall(2).args[0]).to.equals("checkAvailabilityOfModules");
            expect(dispatch.getCall(2).args[1]).to.be.deep.equals({
                "menu": menus.secondaryMenu,
                "notAvailableModules": []
            }
            );
            expect(dispatch.getCall(3).args[0]).to.equals("Alerting/addSingleAlert");
        });

        it("should dispatch Alerting/addSingleAlert with success message when no unavailable modules", () => {
            const event = {
                target: {
                    result: "{\r\n  \"portalConfig\": {},\r\n  \"" + treeTopicConfigKey + "\": {}\r\n}\r\n"
                }
            };

            processConfigJsonOnload({commit, dispatch}, {event, targetFileName: "config.json"});

            const alertCall = dispatch.getCalls().find(c => c.args[0] === "Alerting/addSingleAlert");

            expect(alertCall).to.exist;
            expect(alertCall.args[1]).to.deep.include({category: "success"});
        });

        it("should dispatch checkAvailabilityOfModules for mainMenu and secondaryMenu", () => {
            const event = {
                target: {
                    result: "{\r\n  \"portalConfig\": {\r\n    \"mainMenu\": {\"sections\": []},\r\n    \"secondaryMenu\": {\"sections\": []}\r\n  },\r\n  \"" + treeTopicConfigKey + "\": {}\r\n}\r\n"
                }
            };

            processConfigJsonOnload({commit, dispatch}, {event, targetFileName: "config.json"});

            const checkCalls = dispatch.getCalls().filter(c => c.args[0] === "checkAvailabilityOfModules");

            expect(checkCalls).to.have.length(2);
            expect(checkCalls[0].args[1]).to.have.property("menu");
            expect(checkCalls[1].args[1]).to.have.property("menu");
        });
    });

    describe("checkAvailabilityOfModules", () => {
        let rootGetters;

        beforeEach(() => {
            rootGetters = {
                "Modules/componentMap": {
                    "openConfig": {},
                    "shareView": {}
                }
            };
        });

        it("should not add modules to notAvailableModules if all modules are available", () => {
            const notAvailableModules = [];
            const menu = {
                sections: [[{type: "openConfig"}, {type: "shareView"}]]
            };

            checkAvailabilityOfModules({rootGetters}, {menu, notAvailableModules});

            expect(notAvailableModules).to.have.length(0);
        });

        it("should add unavailable module type to notAvailableModules", () => {
            const notAvailableModules = [];
            const menu = {
                sections: [[{type: "openConfig"}, {type: "unknownModule"}]]
            };

            checkAvailabilityOfModules({rootGetters}, {menu, notAvailableModules});

            expect(notAvailableModules).to.include("unknownModule");
            expect(notAvailableModules).to.have.length(1);
        });

        it("should remove unavailable modules from menu sections", () => {
            const notAvailableModules = [];
            const menu = {
                sections: [[{type: "openConfig"}, {type: "unknownModule"}]]
            };

            checkAvailabilityOfModules({rootGetters}, {menu, notAvailableModules});

            expect(menu.sections[0]).to.deep.equals([{type: "openConfig"}]);
        });

        it("should do nothing if menu is null", () => {
            const notAvailableModules = [];

            expect(() => checkAvailabilityOfModules({rootGetters}, {menu: null, notAvailableModules})).to.not.throw();
            expect(notAvailableModules).to.have.length(0);
        });

        it("should handle multiple sections", () => {
            const notAvailableModules = [];
            const menu = {
                sections: [
                    [{type: "openConfig"}],
                    [{type: "unknownModule"}, {type: "shareView"}]
                ]
            };

            checkAvailabilityOfModules({rootGetters}, {menu, notAvailableModules});

            expect(notAvailableModules).to.deep.equals(["unknownModule"]);
            expect(menu.sections[1]).to.deep.equals([{type: "shareView"}]);
        });
    });
});
