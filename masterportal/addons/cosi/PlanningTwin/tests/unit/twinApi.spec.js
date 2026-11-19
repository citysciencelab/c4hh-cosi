import {expect} from "chai";
import {buildViewUrl, compositionOf, fetchJson, isConfiguredBase, loadBatches, parseViewUrl} from "../../utils/twinApi.js";

/** Planning cases as /api/planfaelle lists them (demo data of the Planungszwilling). */
const PLANFAELLE = [
    {slug: "wohnbau-stand", label: "Wohnungsbau", art: "planungsstand", teile: [], parent: null},
    {slug: "kitas-stand", label: "Kitas", art: "planungsstand", teile: [], parent: null},
    {slug: "oepnv-stand", label: "ÖPNV", art: "planungsstand", teile: [], parent: null},
    {slug: "demo-sicht", label: "Demo-Sicht", art: "variante", parent: null, teile: [
        {slug: "wohnbau-stand", min_reifegrad: 0, stand_at: null},
        {slug: "kitas-stand", min_reifegrad: 0, stand_at: null},
        {slug: "oepnv-stand", min_reifegrad: 3, stand_at: null}
    ]}
];

/**
 * A fetch that answers from a table of urls.
 * @param {Object} answers url → [status, body]
 * @returns {Function} The fetch.
 */
function fakeFetch (answers) {
    return async url => {
        const [status, body] = answers[url] ?? [404, {message: "Nicht gefunden."}];

        return {ok: status < 400, status, json: async () => body};
    };
}

describe("addons/cosi/PlanningTwin/utils/twinApi", () => {
    it("splits and builds view urls", () => {
        expect(parseViewUrl("https://pz.example/oaf/p/demo-sicht/2029")).to.deep.equal({base: "https://pz.example", planfall: "demo-sicht", stichtag: "2029", standAt: null, entfallen: false});
        expect(parseViewUrl("https://pz.example/sub/oaf/p/demo-sicht/2027+entfallen/")).to.include({base: "https://pz.example/sub", stichtag: "2027", entfallen: true});
        expect(parseViewUrl("https://pz.example/oaf/p/x/2029@2026-11-19T10:00:00Z")).to.include({stichtag: "2029", standAt: "2026-11-19T10:00:00Z"});
        expect(parseViewUrl("https://geodienste.hamburg.de/wfs")).to.equal(null);
        expect(buildViewUrl("https://pz.example", "demo-sicht", 2031, true)).to.equal("https://pz.example/oaf/p/demo-sicht/2031+entfallen");
        expect(buildViewUrl("https://pz.example", "demo-sicht", "heute")).to.equal("https://pz.example/oaf/p/demo-sicht/heute");
    });

    it("knows the placeholder of an unset PLANUNGSZWILLING_URL", () => {
        expect(isConfiguredBase("https://planungszwilling.invalid")).to.equal(false);
        expect(isConfiguredBase(null)).to.equal(false);
        expect(isConfiguredBase("http://localhost:3300")).to.equal(true);
    });

    it("flattens the composition with thresholds, a part twice counts once with the higher one", () => {
        const parts = compositionOf("demo-sicht", PLANFAELLE);

        expect(parts.map(p => [p.slug, p.schwelle, p.eigen])).to.deep.equal([
            ["demo-sicht", 0, true], ["wohnbau-stand", 0, false], ["kitas-stand", 0, false], ["oepnv-stand", 3, false]
        ]);

        const twice = [...PLANFAELLE, {slug: "b", label: "B", teile: [{slug: "oepnv-stand", min_reifegrad: 4}, {slug: "demo-sicht", min_reifegrad: 0}]}];

        expect(compositionOf("b", twice).find(p => p.slug === "oepnv-stand").schwelle).to.equal(4);
    });

    it("cuts cycles and follows the parent chain", () => {
        const cyclic = [
            {slug: "a", label: "A", teile: [{slug: "b", min_reifegrad: 1}], parent: null},
            {slug: "b", label: "B", teile: [{slug: "a", min_reifegrad: 0}], parent: null},
            {slug: "c", label: "C", teile: [], parent: "a"}
        ];

        expect(compositionOf("a", cyclic).map(p => p.slug)).to.deep.equal(["a", "b"]);
        expect(compositionOf("c", cyclic).map(p => p.slug)).to.deep.equal(["c", "a", "b"]);
    });

    it("passes the service's sentence on errors", async () => {
        const f = fakeFetch({"x/api/planfaelle": [403, {message: "Kein Leserecht."}]});

        try {
            await fetchJson("x/api/planfaelle", f);
            expect.fail("should throw");
        }
        catch (e) {
            expect(e.message).to.equal("Kein Leserecht.");
        }
    });

    it("loads the batches of every part, a part that fails stays empty", async () => {
        const f = fakeFetch({"x/api/planfaelle/a/stapel": [200, [{id: 1}]]}),
            res = await loadBatches("x", [{slug: "a"}, {slug: "b"}], f);

        expect(res[0].stapel).to.deep.equal([{id: 1}]);
        expect(res[1].stapel).to.deep.equal([]);
        expect(res[1].error).to.equal("Nicht gefunden.");
    });
});
