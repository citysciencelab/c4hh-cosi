// import {describe, it, expect, beforeEach, vi} from "vitest";
// --> the import is not necessary but included commented out to show that the test framework is vitest

import actionsDrawWithoutGui from "../../../store/actionsDrawWithoutGui";

// Mock mapCollection before importing the module under test
const mockMap = {
    getLayers: vi.fn(() => ({getArray: vi.fn(() => [])})),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    addInteraction: vi.fn(),
    removeInteraction: vi.fn(),
    getView: vi.fn(() => ({
        fit: vi.fn(),
        getProjection: vi.fn(() => ({
            getCode: vi.fn(() => "EPSG:25832")
        }))
    }))
};

vi.mock("@core/maps/js/mapCollection", () => ({
    default: {getMap: vi.fn(() => mockMap)}
}));

describe("actionsDrawWithoutGui", () => {
    let mockDispatch, mockRootState, mockFeature;

    beforeEach(() => {
        mockDispatch = vi.fn();
        mockRootState = {
            Maps: {mode: "2D"},
            configJs: {inputMap: {targetProjection: "EPSG:4326"}}
        };
        mockFeature = {
            getGeometry: vi.fn(),
            getId: vi.fn(() => "mock-id"),
            hasProperties: vi.fn(() => true),
            getProperties: vi.fn(() => ({key: "value"})),
            getGeometryName: vi.fn(() => "geometry"),
            clone: vi.fn(() => mockFeature)
        };
        mockFeature.getGeometry.mockReturnValue({
            getType: vi.fn(() => "Point"),
            getCoordinates: vi.fn(() => [1, 2]),
            getCoordinateAt: vi.fn(() => [3, 4]),
            getInteriorPoint: vi.fn(() => ({getCoordinates: vi.fn(() => [1, 2])}))
        });
    });

    it("initDrawWithoutGUI adds layer and interactions", () => {
        actionsDrawWithoutGui.initDrawWithoutGUI({dispatch: mockDispatch}, {drawType: "Point"});

        expect(mockMap.addLayer).toHaveBeenCalled();
        expect(mockMap.addInteraction).toHaveBeenCalled();
    });

    it("initDrawWithoutGUI throws error for missing drawType and handles other wrong parameters gracefully", () => {
        // Mock dispatch
        const dispatch = vi.fn();

        // Call with missing drawType should throw an error
        expect(() => actionsDrawWithoutGui.initDrawWithoutGUI({dispatch}, {})).toThrow("Invalid type: undefined");

        // Call with invalid color should not throw an error
        expect(() => actionsDrawWithoutGui.initDrawWithoutGUI({dispatch}, {drawType: "Point", color: "not-an-array"})).not.toThrow();

        // Call with invalid initialJSON should not throw an error
        expect(() => actionsDrawWithoutGui.initDrawWithoutGUI({dispatch}, {drawType: "Point", initialJSON: 12345})).not.toThrow();
    });

    it("clearLayer removes the drawWithoutGuiLayer if present", () => {
        mockMap.getLayers.mockReturnValue({getArray: vi.fn(() => [{get: vi.fn(() => "drawWithoutGuiLayer")}])});
        actionsDrawWithoutGui.clearLayer();

        expect(mockMap.removeLayer).toHaveBeenCalled();
    });

    it("downloadFeaturesWithoutGUI returns a FeatureCollection", async () => {
        // Setup mock drawLayer with get and getSource and getFeatures
        const mockDrawLayer = {
            get: vi.fn((key) => key === "id" ? "drawWithoutGuiLayer" : undefined),
            getSource: vi.fn(() => ({
                getFeatures: vi.fn(() => [mockFeature])
            }))
        };

        mockMap.getLayers.mockReturnValue({
            getArray: vi.fn(() => [mockDrawLayer])
        });

        const result = await actionsDrawWithoutGui.downloadFeaturesWithoutGUI({rootState: mockRootState}, {prmObject: {}, currentFeature: mockFeature});

        expect(result).toHaveProperty("type", "FeatureCollection");
        expect(result).toHaveProperty("features");
        expectTypeOf(result.features).toBeArray();
        expect(result.features.length).toBeGreaterThan(0);
    });

    it("createCenterPoint returns correct coordinates for Point", () => {
        const coords = actionsDrawWithoutGui.createCenterPoint({rootState: mockRootState}, {feature: mockFeature});

        expect(Array.isArray(coords)).toBe(true);
        expect(coords).toEqual([1, 2]);
    });

    it("addCenterPoint adds centerPoint to feature properties", async () => {
        const geoJSON = {features: [{properties: null}]},
            mockDispatch2 = vi.fn(() => Promise.resolve([1, 2])),
            result = await actionsDrawWithoutGui.addCenterPoint({dispatch: mockDispatch2}, {feature: mockFeature, targetProjection: undefined, geoJSON});

        expect(result.features[0].properties.centerPoint.coordinates).toEqual([1, 2]);
    });

    it("finalizeAndSendGeoJSON calls dispatch and removes interaction", async () => {
        // Ensure rootState.configJs.inputMap is defined and $remoteInterface.sendMessage is a mock
        mockRootState = {
            configJs: {
                inputMap: {targetProjection: "EPSG:4326"}
            },
            Maps: {mode: "2D"}
        };

        // Robust dispatch mock based on action name (first argument)
        const dispatch = vi.fn((action) => {
            if (action === "createCenterPoint") {
                return Promise.resolve([1, 2]);
            }
            if (action === "downloadFeaturesWithoutGUI") {
                return Promise.resolve({features: [{properties: null}]});
            }
            if (action === "addCenterPoint") {
                return Promise.resolve({type: "FeatureCollection", features: [{properties: {centerPoint: [1, 2]}}]});
            }
            return Promise.resolve();
        });

        const context = {dispatch, rootState: mockRootState},
            interaction = {dummy: true},
            event = {
                feature: mockFeature,
                features: {getArray: vi.fn(() => [mockFeature])}
            };

        const app = {config: {globalProperties: {$remoteInterface: {sendMessage: vi.fn()}}}};

        actionsDrawWithoutGui.$app = app;
        actionsDrawWithoutGui.finalizeAndSendGeoJSON(context, {event, interaction});

        // Wait for all microtasks to complete
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(app.config.globalProperties.$remoteInterface.sendMessage).toHaveBeenCalledTimes(1);
    });
});
