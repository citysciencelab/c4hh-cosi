import {expect} from "chai";
import {
    buildPredicate, filterSpecSentence, getAttrStats, newCondition, newGroup, seedCondition, toNumber
} from "../../utils/filterSpec.js";

const rows = [
    {typ: "Kita", plaetze: "40", bezirk: "Mitte"},
    {typ: "Kita", plaetze: "120", bezirk: "Altona"},
    {typ: "Schule", plaetze: 600, bezirk: "Mitte"},
    {typ: "Jugend", plaetze: "12,5", bezirk: "Eimsbüttel"},
    {typ: "Jugend", plaetze: null, bezirk: "Mitte"}
];

/**
 * Number of rows a spec keeps.
 * @param {Object} spec Filter spec.
 * @returns {Number} The count.
 */
function run (spec) {
    const pred = buildPredicate(spec);

    return pred ? rows.filter(r => pred(a => r[a])).length : rows.length;
}

/**
 * A condition for the tests.
 * @param {String} attr Attribute.
 * @param {Object} patch Condition values.
 * @param {String|null} [joiner=null] Joiner.
 * @returns {Object} The condition.
 */
function cond (attr, patch, joiner = null) {
    return {...newCondition(joiner), attr, ...patch};
}

describe("addons/cosi/LayerFilter/utils/filterSpec", () => {
    it("reads numbers in strings, also with a decimal comma", () => {
        expect(toNumber("40")).to.equal(40);
        expect(toNumber("12,5")).to.equal(12.5);
        expect(toNumber("12 Plätze")).to.be.NaN;
        expect(toNumber(null)).to.be.NaN;
    });

    it("classifies a column of numeric strings as numeric", () => {
        const stats = getAttrStats(rows, "plaetze");

        expect(stats.type).to.equal("numeric");
        expect(stats.min).to.equal(12.5);
        expect(stats.max).to.equal(600);
    });

    it("lists sorted unique values of a categorical column", () => {
        expect(getAttrStats(rows, "typ")).to.deep.equal({type: "categorical", values: ["Jugend", "Kita", "Schule"], truncated: false});
        expect(getAttrStats(rows, "nix").type).to.equal("empty");
    });

    it("seeds a numeric condition with the full range and a categorical one with 'alle'", () => {
        expect(seedCondition(getAttrStats(rows, "plaetze"))).to.include({type: "range", lo: 12.5, hi: 600});
        expect(seedCondition(getAttrStats(rows, "typ")).values).to.equal(undefined);
    });

    it("treats 'alle' as no restriction and [] as nothing", () => {
        expect(buildPredicate({items: [cond("typ", {type: "in"})]})).to.equal(null);
        expect(run({items: [cond("typ", {type: "in", values: []})]})).to.equal(0);
    });

    it("filters by range and by value list", () => {
        expect(run({items: [cond("plaetze", {type: "range", lo: 30, hi: 200})]})).to.equal(2);
        expect(run({items: [cond("typ", {type: "in", values: ["Kita", "Schule"]})]})).to.equal(3);
    });

    it("binds AND before OR", () => {
        // (typ = Kita UND bezirk = Mitte) ODER typ = Schule  → 1 + 1
        const spec = {items: [
            cond("typ", {type: "in", values: ["Kita"]}),
            cond("bezirk", {type: "in", values: ["Mitte"]}, "and"),
            cond("typ", {type: "in", values: ["Schule"]}, "or")
        ]};

        expect(run(spec)).to.equal(2);
        expect(filterSpecSentence(spec)).to.equal("(typ = Kita UND bezirk = Mitte) ODER typ = Schule");
    });

    it("combines group members with the group operator", () => {
        const group = newGroup(null, "or");

        group.conditions = [cond("typ", {type: "in", values: ["Jugend"]}), cond("plaetze", {type: "range", lo: 500, hi: 600})];
        expect(run({items: [group]})).to.equal(3);
        group.op = "and";
        expect(run({items: [group]})).to.equal(0);
    });

    it("names ignored conditions in the sentence", () => {
        const spec = {items: [cond("typ", {type: "in", values: ["Kita"]}), newCondition("and")]};

        expect(filterSpecSentence(spec)).to.equal("typ = Kita — eine unvollständige Bedingung zählt nicht");
    });

    it("treats pipe-separated strings as lists of values", () => {
        const list = [{form: "Grundschule|Stadtteilschule"}, {form: "Gymnasium"}, {form: "Stadtteilschule"}],
            pred = buildPredicate({items: [cond("form", {type: "in", values: ["Stadtteilschule"]})]});

        expect(getAttrStats(list, "form").values).to.deep.equal(["Grundschule", "Gymnasium", "Stadtteilschule"]);
        expect(list.filter(r => pred(a => r[a])).length).to.equal(2);
    });

    it("writes years without a thousands separator", () => {
        expect(filterSpecSentence({items: [cond("jahr", {type: "range", lo: 2009, hi: 2026})]})).to.equal("jahr von 2009 bis 2026");
        expect(filterSpecSentence({items: [cond("n", {type: "range", lo: 10000, hi: 20000})]})).to.equal("n von 10.000 bis 20.000");
    });

    it("uses display labels in the sentence", () => {
        const spec = {items: [cond("plaetze", {type: "range", lo: 10, hi: 50})]};

        expect(filterSpecSentence(spec, a => a === "plaetze" ? "Plätze" : a)).to.equal("Plätze von 10 bis 50");
    });
});
