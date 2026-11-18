import {expect} from "chai";
import sortDropdownItems, {compareDropdownItems, sortSelectedValues} from "@shared/js/utils/sortDropdownItems.js";

describe("src/shared/js/utils/sortDropdownItems.js", () => {
    const items = [
        {value: "c", title: "Ückeritz"},
        {value: "a", title: "anklam"},
        {value: "b", title: "Güstrow"},
        {value: "d", title: "Berlin"}
    ];

    describe("compareDropdownItems", () => {
        it("should compare strings and objects alphabetically, ignoring case and umlauts", () => {
            expect(compareDropdownItems("anklam", "Berlin")).to.be.below(0);
            expect(compareDropdownItems({title: "Ückeritz"}, {title: "Vogelsang"})).to.be.below(0);
        });

        it("should compare numbers within titles numerically", () => {
            expect(compareDropdownItems("Item 2", "Item 10")).to.be.below(0);
        });

        it("should use the given title property", () => {
            expect(compareDropdownItems({name: "A", title: "Z"}, {name: "B", title: "Y"}, "name")).to.be.below(0);
        });

        it("should place pinned items first and keep their order", () => {
            expect(compareDropdownItems({title: "Z", pinned: true}, {title: "A"})).to.equal(-1);
            expect(compareDropdownItems({title: "A"}, {title: "Z", pinned: true})).to.equal(1);
            expect(compareDropdownItems({title: "Z", pinned: true}, {title: "A", pinned: true})).to.equal(0);
        });

        it("should treat undefined, null and empty values as empty title", () => {
            [undefined, null, "", {}].forEach(value => {
                expect(compareDropdownItems(value, "A")).to.be.below(0);
            });
        });
    });

    describe("sortDropdownItems", () => {
        it("should return an empty array for invalid or empty items", () => {
            [undefined, null, "", [], {}].forEach(value => {
                expect(sortDropdownItems(value)).to.be.an("array").that.is.empty;
            });
        });

        it("should sort the items alphabetically by title", () => {
            expect(sortDropdownItems(items).map(item => item.value)).to.deep.equal(["a", "d", "b", "c"]);
        });

        it("should sort string items alphabetically", () => {
            expect(sortDropdownItems(["Population", "employment"])).to.deep.equal(["employment", "Population"]);
        });

        it("should ignore selected values if selectedFirst is false", () => {
            expect(sortDropdownItems(items, {selectedValues: ["c"]}).map(item => item.value)).to.deep.equal(["a", "d", "b", "c"]);
        });

        it("should place the selected items first, matched by value or by object", () => {
            expect(sortDropdownItems(items, {selectedValues: ["c", "b"], selectedFirst: true}).map(item => item.value)).to.deep.equal(["b", "c", "a", "d"]);
            expect(sortDropdownItems(items, {selectedValues: [items[0]], selectedFirst: true}).map(item => item.value)).to.deep.equal(["c", "a", "d", "b"]);
        });

        it("should place pinned items first within the selected and not selected items", () => {
            const pinned = {title: "All", pinned: true},
                pinnedItems = [...items, pinned];

            expect(sortDropdownItems(pinnedItems)[0]).to.equal(pinned);
            expect(sortDropdownItems(pinnedItems, {selectedValues: ["c"], selectedFirst: true}).map(item => item.title)).to.deep.equal([
                "Ückeritz", "All", "anklam", "Berlin", "Güstrow"
            ]);
            expect(sortDropdownItems(pinnedItems, {selectedValues: ["c", pinned], selectedFirst: true}).map(item => item.title)).to.deep.equal([
                "All", "Ückeritz", "anklam", "Berlin", "Güstrow"
            ]);
        });

        it("should not sort grouped items", () => {
            const grouped = [{type: "subheader", title: "Z"}, {title: "B"}, {title: "A"}];

            expect(sortDropdownItems(grouped)).to.deep.equal(grouped);
        });

        it("should not mutate the given items", () => {
            const copy = [...items];

            sortDropdownItems(items, {selectedValues: ["c"], selectedFirst: true});

            expect(items).to.deep.equal(copy);
        });
    });

    describe("sortSelectedValues", () => {
        it("should return an empty array for invalid or empty selected values", () => {
            [undefined, null, "", [], {}].forEach(value => {
                expect(sortSelectedValues(items, value)).to.be.an("array").that.is.empty;
            });
        });

        it("should sort the selected values by the titles of their items", () => {
            expect(sortSelectedValues(items, ["c", "d", "a"])).to.deep.equal(["a", "d", "c"]);
        });

        it("should sort selected objects and place pinned ones first", () => {
            const pinned = {title: "All", pinned: true};

            expect(sortSelectedValues([...items, pinned], [items[0], pinned, items[1]])).to.deep.equal([pinned, items[1], items[0]]);
        });

        it("should append selected values without a matching item unchanged", () => {
            expect(sortSelectedValues(items, ["x", "c", "a"])).to.deep.equal(["a", "c", "x"]);
            [undefined, null, "", {}].forEach(value => {
                expect(sortSelectedValues(value, ["x", "c"])).to.deep.equal(["x", "c"]);
            });
        });

        it("should not mutate the given selected values", () => {
            const selectedValues = ["c", "a"];

            sortSelectedValues(items, selectedValues);

            expect(selectedValues).to.deep.equal(["c", "a"]);
        });
    });
});
