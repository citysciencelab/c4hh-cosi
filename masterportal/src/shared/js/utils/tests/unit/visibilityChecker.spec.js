import {expect} from "chai";
import visibilityChecker from "@shared/js/utils/visibilityChecker.js";

describe("src/shared/js/utils/isModuleVisible", () => {
    describe("visibilityChecker.isModuleVisible", () => {
        it("should return true if mapMode is '2D' and deviceMode is 'Desktop'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop"
            })).to.be.true;
        });

        it("should return true if mapMode is '2D' and deviceMode is 'Mobile'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Mobile"
            })).to.be.true;
        });

        it("should return true if mapMode is '2D' and deviceMode is 'Table'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Table"
            })).to.be.true;
        });

        it("should return true if mapMode is '3D' and deviceMode is 'Desktop'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Desktop"
            })).to.be.true;
        });

        it("should return true if mapMode is '3D' and deviceMode is 'Mobile'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Mobile"
            })).to.be.true;
        });

        it("should return true if mapMode is '3D' and deviceMode is 'Table'", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table"
            })).to.be.true;
        });

        it("should return true if supportedMapModes and supportedDevices contains mapMode and deviceMode ", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table",
                supportedMapModes: ["3D"],
                supportedDevices: ["Table"]
            })).to.be.true;
        });

        it("should return false if supportedMapModes and supportedDevices doesn't contains mapMode and deviceMode ", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table",
                supportedMapModes: ["2D"],
                supportedDevices: ["Mobile"]
            })).to.be.false;
        });

        it("should return false if supportedTreeType doesn't contains treeType ", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table",
                treeType: "light",
                supportedMapModes: ["3D"],
                supportedDevices: ["Table"],
                supportedTreeTypes: ["auto"]
            })).to.be.false;
        });

        it("should return false if one of supportedMapModes and supportedDevices doesn't contains mapMode and deviceMode ", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table",
                supportedMapModes: ["3D"],
                supportedDevices: ["Mobile"]
            })).to.be.false;
            expect(visibilityChecker.isModuleVisible({
                mapMode: "3D",
                deviceMode: "Table",
                supportedMapModes: ["2D"],
                supportedDevices: ["Table"]
            })).to.be.false;
        });
        it("should return true if an element is visible based on the visibleLayerConfigs", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer1"]
                    }
                ],

                visibleLayerConfigs = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.true;
        });

        it("should return false if an element requires a visible layer but the required layer is not visible", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer1"]
                    }
                ],

                visibleLayerConfigs = [
                    {id: "layer1", visibility: false},
                    {id: "layer2", visibility: false}
                ];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.false;
        });

        it("should return true if an element is visible when no layers are specified in visibleLayerConfigs", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"]
                    }
                ],

                visibleLayerConfigs = [];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.true;
        });

        it("should return false if an element requires a visible layer but no matching visibleLayerConfigs are provided", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer1"]
                    }
                ],

                visibleLayerConfigs = [];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.false;
        });

        it("should return true if an element has no showOnlyByLayersVisible property", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"]
                    }
                ],

                visibleLayerConfigs = [
                    {id: "layer1", visibility: true}
                ];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.true;
        });

        it("should return true if no elements are provided and visibleLayerConfigs is empty", () => {
            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements: [],
                visibleLayerConfigs: []
            })).to.be.true;
        });

        it("should return false if elements have showOnlyByLayersVisible property and required layers are not visible", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer1"]
                    }
                ],

                visibleLayerConfigs = [
                    {id: "layer1", visibility: false}
                ];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.false;
        });

        it("should return true if one of the elements' required layers is visible", () => {
            const elements = [
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer1"]
                    },
                    {
                        supportedMapModes: ["2D"],
                        showOnlyByLayersVisible: ["layer2"]
                    }
                ],

                visibleLayerConfigs = [
                    {id: "layer1", visibility: true},
                    {id: "layer2", visibility: false}
                ];

            expect(visibilityChecker.isModuleVisible({
                mapMode: "2D",
                deviceMode: "Desktop",
                elements,
                visibleLayerConfigs
            })).to.be.true;
        });
    });

    it("should return true if elements are provided and one element is valid for the mapMode", () => {
        const elements = [
            {supportedMapModes: ["2D"]},
            {supportedMapModes: ["3D"]}
        ];

        expect(visibilityChecker.isModuleVisible({
            mapMode: "2D",
            deviceMode: "Desktop",
            elements
        })).to.be.true;
    });

    it("should return false if elements are provided and none of them are valid for the mapMode", () => {
        const elements = [
            {supportedMapModes: ["3D"]},
            {supportedMapModes: ["3D"]}
        ];

        expect(visibilityChecker.isModuleVisible({
            mapMode: "2D",
            deviceMode: "Desktop",
            elements
        })).to.be.false;
    });

    it("should return true if no elements are provided (should fallback to default visibility check)", () => {
        expect(visibilityChecker.isModuleVisible({
            mapMode: "2D",
            deviceMode: "Desktop",
            elements: []
        })).to.be.true;
    });

    it("should return true if elements are provided but no mapMode is defined (should fallback to default visibility check)", () => {
        const elements = [
            {supportedMapModes: ["2D"]},
            {supportedMapModes: ["3D"]}
        ];

        expect(visibilityChecker.isModuleVisible({
            mapMode: "2D",
            deviceMode: "Desktop",
            elements
        })).to.be.true;
    });
});
