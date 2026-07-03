
import {vi} from "vitest";

/**
 * On-demand mocks for Cesium libraries.
 * Import this file in spec files that directly use Cesium (e.g. buildCesiumImageLayer, drawCesiumMask).
 * Keeping these out of the global setup avoids unnecessary overhead for tests that do not use Cesium.
 */

// Mock the main cesium package that OLCS actually imports from
vi.mock("cesium", () => ({
    default: {
        // Core Cesium classes that OLCS uses
        AutomaticUniforms: vi.fn(() => ({data: "mocked data"})),
        Viewer: vi.fn(),
        Scene: vi.fn(),
        Camera: vi.fn(),
        Globe: vi.fn(),
        Ellipsoid: vi.fn(),
        Cartesian3: vi.fn(),
        Matrix4: vi.fn(),
        Color: vi.fn(),
        Material: vi.fn(),
        Primitive: vi.fn(),
        GeometryInstance: vi.fn(),
        PerInstanceColorAppearance: vi.fn(),
        ClassificationType: vi.fn(),
        HeightReference: vi.fn(),
        VerticalOrigin: vi.fn(),
        HorizontalOrigin: vi.fn(),
        SceneMode: vi.fn(),
        ScreenSpaceEventHandler: vi.fn(),
        ScreenSpaceEventType: vi.fn(),
        KeyboardEventModifier: vi.fn(),
        CesiumTerrainProvider: vi.fn(),
        WebMercatorProjection: vi.fn(),
        GeographicProjection: vi.fn(),
        DataSource: vi.fn(),
        EntityCollection: vi.fn(),
        Entity: vi.fn(),
        CallbackProperty: vi.fn(),
        ConstantProperty: vi.fn(),
        SampledProperty: vi.fn(),
        TimeInterval: vi.fn(),
        TimeIntervalCollection: vi.fn(),
        JulianDate: vi.fn(),
        Clock: vi.fn(),
        ClockRange: vi.fn(),
        ClockStep: vi.fn()
    },
    // Named exports that OLCS expects
    AutomaticUniforms: vi.fn(() => ({data: "mocked data"})),
    Viewer: vi.fn(),
    Scene: vi.fn(),
    Camera: vi.fn(),
    Globe: vi.fn(),
    Ellipsoid: vi.fn(),
    Cartesian3: vi.fn(),
    Matrix4: vi.fn(),
    Color: vi.fn(),
    Material: vi.fn(),
    Primitive: vi.fn(),
    GeometryInstance: vi.fn(),
    PerInstanceColorAppearance: vi.fn(),
    ClassificationType: vi.fn(),
    HeightReference: vi.fn(),
    VerticalOrigin: vi.fn(),
    HorizontalOrigin: vi.fn(),
    SceneMode: vi.fn(),
    ScreenSpaceEventHandler: vi.fn(),
    ScreenSpaceEventType: vi.fn(),
    KeyboardEventModifier: vi.fn(),
    CesiumTerrainProvider: vi.fn(),
    WebMercatorProjection: vi.fn(),
    GeographicProjection: vi.fn(),
    DataSource: vi.fn(),
    EntityCollection: vi.fn(),
    Entity: vi.fn(),
    CallbackProperty: vi.fn(),
    ConstantProperty: vi.fn(),
    SampledProperty: vi.fn(),
    TimeInterval: vi.fn(),
    TimeIntervalCollection: vi.fn(),
    JulianDate: vi.fn(),
    Clock: vi.fn(),
    ClockRange: vi.fn(),
    ClockStep: vi.fn()
}));

// Mock @cesium/engine, @cesium/widgets as fallback for any direct imports
vi.mock("@cesium/engine", () => ({
    default: {},
    AutomaticUniforms: vi.fn(() => ({data: "mocked data"}))
}));
vi.mock("@cesium/widgets", () => ({
    default: {}
}));

export {};
