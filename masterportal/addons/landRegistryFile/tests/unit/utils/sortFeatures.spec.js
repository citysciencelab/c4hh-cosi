import {expect} from "chai";

import {getSortedFeatures} from "../../../utils/sortFeatures.js";

describe("getSortedFeatures", () => {
    it("sorts numeric strings before text", () => {
        const features = [
            {id: "1", properties: {bezeichnung_des_vorhabens: "Neubau"}},
            {id: "2", properties: {bezeichnung_des_vorhabens: "10"}},
            {id: "3", properties: {bezeichnung_des_vorhabens: "Ausbau"}},
            {id: "4", properties: {bezeichnung_des_vorhabens: "2"}},
            {id: "5", properties: {bezeichnung_des_vorhabens: "1. Neubau"}}
        ];

        const sorted = getSortedFeatures(features, "bezeichnung_des_vorhabens");

        expect(sorted.map(({id}) => id)).to.deep.equal([
            "4", "2", "5", "3", "1"
        ]);
    });

    it("puts null and empty values after populated values", () => {
        ["", null].forEach(value => {
            const features = [
                {id: "missing", properties: {bezeichnung_des_vorhabens: value}},
                {id: "present", properties: {bezeichnung_des_vorhabens: "Ausbau"}}
            ];

            expect(getSortedFeatures(features, "bezeichnung_des_vorhabens").map(({id}) => id))
                .to.deep.equal(["present", "missing"]);
        });
    });
});
