
import {vi} from "vitest";

/**
 * On-demand mocks for Chart.js.
 * Import this file in spec files that directly use Chart.js (e.g. Piechart, Barchart, Linechart, SensorThemeBarChart).
 * Keeping these out of the global setup avoids unnecessary overhead for tests that do not use charts.
 */

// Mock chart.js
vi.mock("chart.js", () => ({
    Chart: class {
        /**
         *
         */
        constructor (canvas, chartsConfig) {
            this.config = chartsConfig;
            this.data = chartsConfig.data;
            this.stop = vi.fn();
            this.destroy = vi.fn();
            this.update = vi.fn();
            this.render = vi.fn();
        }

        static defaults = {
            font: {},
            color: ""
        };

        /**
         *
         */
        static getChart () {
            return {
                stop: vi.fn(),
                destroy: vi.fn()
            };
        }
    }
}));

// Mock chart.js/auto
vi.mock("chart.js/auto", () => ({
    default: class {
        /**
         *
         */
        constructor (_canvas, chartsConfig) {
            this.config = chartsConfig;
            this.data = chartsConfig.data;
            this.stop = vi.fn();
            this.destroy = vi.fn();
            this.update = vi.fn();
            this.render = vi.fn();
        }

        static defaults = {
            font: {},
            color: ""
        };

        /**
         *
         */
        static getChart () {
            return {
                stop: vi.fn(),
                destroy: vi.fn()
            };
        }
    }
}));

export {};
