import {expect} from "chai";

import buildOafFilterString from "../../../utils/buildOafFilterString.js";

describe("addons/landRegistryFile/tests/unit/utils/buildOafFilterString.spec.js", () => {
    const filters = {
        dateRangeField: "date_letzte_aktivitaet",
        textSearchFields: ["adresse", "bezeichnung_des_vorhabens"],
        select: [
            {
                field: "aktenart",
                options: [
                    {value: "Bauaufsichtsakten", color: "#181818", needsExtraFilter: true},
                    {value: "Straßenakten", color: "#ffee00"},
                    {value: "Grünanlagenakten", color: "#fa0606"},
                    {value: "Naturschutzakten", color: "#3a9705"},
                    {value: "Gewässerakten", color: "#0755F2"},
                    {value: "Kehrbezirksakten", color: "#704e2e"}
                ],
                multiple: true
            },
            {
                field: "bezirk",
                options: [
                    {value: "Altona"},
                    {value: "Bergedorf"},
                    {value: "Eimsbüttel"},
                    {value: "Hamburg-Mitte "},
                    {value: "Hamburg-Nord"},
                    {value: "Harburg"},
                    {value: "Wandsbek"},
                    {value: "HPA"}
                ],
                multiple: false
            }
        ]
    };

    it("combines date, text, and selected filters in order", () => {
        const result = buildOafFilterString(filters, {
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            textValue: "Schule",
            selectedFilters: {
                aktenart: ["Bauaufsichtsakten", "Gewässerakten"],
                bezirk: "Altona"
            }
        });

        expect(result).to.equal(
            "(date_letzte_aktivitaet >= DATE('2024-01-01') AND date_letzte_aktivitaet <= DATE('2024-12-31')) AND " +
            "(CASEI(adresse) LIKE CASEI('%Schule%') OR CASEI(bezeichnung_des_vorhabens) LIKE CASEI('%Schule%')) AND " +
            "(aktenart = 'Bauaufsichtsakten' OR aktenart = 'Gewässerakten') AND " +
            "(bezirk = 'Altona')"
        );
    });

    it("adds a date filter only when both dates are provided", () => {
        expect(buildOafFilterString(filters, {
            startDate: "2024-01-01"
        })).to.equal("");

        expect(buildOafFilterString(filters, {
            endDate: "2024-12-31"
        })).to.equal("");

        expect(buildOafFilterString(filters, {
            startDate: "2024-01-01",
            endDate: "2024-12-31"
        })).to.equal(
            "(date_letzte_aktivitaet >= DATE('2024-01-01') AND date_letzte_aktivitaet <= DATE('2024-12-31'))"
        );
    });

    it("includes only selected values that are configured as options", () => {
        const result = buildOafFilterString(filters, {
            selectedFilters: {
                aktenart: ["Bauaufsichtsakten", "Not configured"],
                bezirk: "Harburg"
            }
        });

        expect(result).to.equal(
            "(aktenart = 'Bauaufsichtsakten') AND (bezirk = 'Harburg')"
        );
    });

    it("returns an empty string when no filters are provided", () => {
        expect(buildOafFilterString(filters, {})).to.equal("");
    });

    it("returns an empty string when selected filters have no valid selections", () => {
        const result = buildOafFilterString(filters, {
            selectedFilters: {
                aktenart: [],
                bezirk: "Not configured"
            }
        });

        expect(result).to.equal("");
    });

    it("returns an empty string when text search fields are empty", () => {
        ["", null].forEach(value => {
            const result = buildOafFilterString(filters, {
                textValue: value
            });

            expect(result).to.equal("");
        });
    });
});
