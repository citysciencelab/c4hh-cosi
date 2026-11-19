import {expect} from "chai";
import {
    assignLanes, balanceRows, collectionColor, datePosition, entrySentence, isEffective, stichtagDate,
    timelineEntries, timelineRows, yearRange
} from "../../utils/twinTimeline.js";

/** Batches like /api/planfaelle/{slug}/stapel answers (demo data). */
const BATCHES = [
    {part: {slug: "demo-sicht", label: "Demo-Sicht", schwelle: 0, standAt: null}, stapel: [
        {id: 6, status: "gilt", note: "Baufeld und Kita", created_at: "2026-11-18T22:00:40Z", eintraege: [
            {id: 8, sammlung: "wohnbau", objekt_id: "pf-2", op: "insert", after: {we: 180, name: "Demo-Baufeld"}, wirksam_ab: "2029-06-01", reifegrad: 3, vorhaben: "quartier-demo", abschnitt: "BA2"},
            {id: 9, sammlung: "kitas", objekt_id: "pf-1", op: "insert", after: {name: "Demo-Kita"}, wirksam_ab: "2029-08-01", reifegrad: 3, vorhaben: "quartier-demo", abschnitt: "BA2"}
        ]},
        {id: 5, status: "gilt", created_at: "2026-11-18T22:00:40Z", eintraege: [
            {id: 7, sammlung: "gebaeude", objekt_id: "geb-7", op: "delete", before: {bezeichnung: "Demo-Gebäude 7", we: 24}, entfaellt: {we: 24}, wirksam_ab: "2027-03-01", reifegrad: 3}
        ]},
        {id: 4, status: "vorgeschlagen", created_at: "2026-11-18T22:00:40Z", eintraege: [
            {id: 99, sammlung: "kitas", objekt_id: "pf-9", op: "insert", after: {name: "nur vorgeschlagen"}, wirksam_ab: "2028-01-01"}
        ]}
    ]},
    {part: {slug: "oepnv-stand", label: "ÖPNV", schwelle: 3, standAt: null}, stapel: [
        {id: 2, status: "gilt", created_at: "2026-11-18T22:00:40Z", eintraege: [
            {id: 3, sammlung: "oepnv_halte", objekt_id: "pf-3", op: "insert", after: {name: "Halt Mitte"}, wirksam_ab: "2030-12-01", reifegrad: 3},
            {id: 4, sammlung: "oepnv_halte", objekt_id: "pf-4", op: "insert", after: {name: "Halt Süd"}, wirksam_ab: "2033-12-01", reifegrad: 2}
        ]}
    ]},
    {part: {slug: "kitas-stand", label: "Kitas", schwelle: 0, standAt: "2026-01-01T00:00:00Z"}, stapel: [
        {id: 1, status: "gilt", created_at: "2026-11-18T22:00:40Z", eintraege: [
            {id: 1, sammlung: "kitas", objekt_id: "kita-2", op: "update", after: {plaetze_krippe: 30}, before: {name: "Kita 2"}, wirksam_ab: "2027-08-01", reifegrad: 4}
        ]}
    ]}
];

describe("addons/cosi/PlanningTwin/utils/twinTimeline", () => {
    it("flattens batches in force, sorted by date, with names and thresholds", () => {
        const entries = timelineEntries(BATCHES);

        expect(entries.map(e => e.name)).to.deep.equal(["Demo-Gebäude 7", "Demo-Baufeld", "Demo-Kita", "Halt Mitte", "Halt Süd"]);
        expect(entries.find(e => e.name === "Halt Süd").unterSchwelle).to.equal(true);
        expect(entries.find(e => e.name === "Halt Mitte").unterSchwelle).to.equal(false);
        // a part frozen at stand_at ignores batches created later
        expect(entries.some(e => e.objektId === "kita-2")).to.equal(false);
    });

    it("tells which entries count at a date (SPEC: Kita 2029 not there in 2027, demolition 2027 not yet in 2026)", () => {
        const entries = timelineEntries(BATCHES);

        /**
         * The objects in force at a date.
         * @param {String} date "JJJJ-MM-TT".
         * @returns {String[]} Object ids.
         */
        function at (date) {
            return entries.filter(e => isEffective(e, date)).map(e => e.objektId);
        }

        expect(at("2026-12-31")).to.deep.equal([]);
        expect(at("2027-12-31")).to.deep.equal(["geb-7"]);
        expect(at("2029-12-31")).to.deep.equal(["geb-7", "pf-2", "pf-1"]);
        expect(at("2040-12-31")).to.not.include("pf-4");
        expect(isEffective({datum: "2026-01-01", bis: "2028-08-01", unterSchwelle: false}, "2028-08-01")).to.equal(false);
    });

    it("reads a Stichtag path segment as a date", () => {
        expect(stichtagDate("2029")).to.equal("2029-12-31");
        expect(stichtagDate("2029-06-01")).to.equal("2029-06-01");
        expect(stichtagDate("heute", new Date("2026-11-19T12:00:00Z"))).to.equal("2026-11-19");
    });

    it("spans this year to 15 ahead, widened by entries and phases", () => {
        expect(yearRange([], [], 2026)).to.deep.equal([2026, 2041]);
        expect(yearRange([{datum: "2045-01-01", bis: null}], [{ab: "2024-07-01", bis: "2028-12-31"}], 2026)).to.deep.equal([2024, 2045]);
        expect(datePosition("2026-01-01", [2026, 2027])).to.equal(0);
        expect(datePosition("2027-07-02", [2026, 2027])).to.be.closeTo(0.75, 0.01);
        expect(datePosition("2030-01-01", [2026, 2027])).to.equal(1);
    });

    it("gives one row per collection in the fixed colour order", () => {
        const rows = timelineRows(timelineEntries(BATCHES));

        expect(rows.map(r => r.key)).to.deep.equal(["kitas", "wohnbau", "gebaeude", "oepnv_halte"]);
        expect(rows[0].color).to.equal(collectionColor("kitas"));
        expect(collectionColor("unbekannt")).to.equal("#52514e");
    });

    it("puts an entry in words", () => {
        const kita = timelineEntries(BATCHES).find(e => e.objektId === "pf-1");

        expect(entrySentence(kita, {"quartier-demo": "Quartier Demo"})).to.equal("neu ab 01.08.2029 · Reifegrad Planrecht bzw. Planfeststellung · Quartier Demo, BA2");
    });

    it("turns the balance into chart rows (SPEC: 2027 −24, 2029 +180)", () => {
        const bilanz = {zeilen: [
            {gruppe: {}, jahr: 2027, werte: {we: {neu: 0, entfaellt: 24, netto: -24, kumuliert: -24}}},
            {gruppe: {}, jahr: 2029, werte: {we: {neu: 180, entfaellt: 0, netto: 180, kumuliert: 156}}}
        ]};

        expect(balanceRows(bilanz)).to.deep.equal([
            {jahr: 2027, neu: 0, entfaellt: 24, netto: -24, kumuliert: -24},
            {jahr: 2029, neu: 180, entfaellt: 0, netto: 180, kumuliert: 156}
        ]);
        expect(balanceRows(null)).to.deep.equal([]);
    });

    it("puts markers that would overlap into further lanes", () => {
        expect(assignLanes([10, 12, 13, 40, 41], 14)).to.deep.equal([0, 1, 2, 0, 1]);
        expect(assignLanes([], 14)).to.deep.equal([]);
    });
});
