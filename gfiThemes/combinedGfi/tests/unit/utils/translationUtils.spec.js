import {expect} from "chai";
import {translateKeyIfPossible} from "../../../utils/translationUtils.js";

describe("addons/gfiThemes/combinedGfi/utils/translationUtils.js", () => {
    let originalI18next;

    beforeEach(() => {
        originalI18next = global.i18next;
        global.i18next = {
            t: (key) => {
                const translations = {
                        "common:test.key": "Test Key",
                        "additional:test.value": "Test Value"
                    },
                    parts = key.split(":");

                if (translations[key]) {
                    return translations[key];
                }

                if (parts.length >= 2) {
                    return parts[1];
                }

                return key;
            }
        };
    });

    afterEach(() => {
        global.i18next = originalI18next;
    });

    describe("translateKeyIfPossible", () => {
        it("translates a valid translation key", () => {
            const result = translateKeyIfPossible("common:test.key");

            expect(result).to.equal("Test Key");
        });

        it("returns the part after colon for unknown keys", () => {
            const result = translateKeyIfPossible("unknown:key");

            expect(result).to.equal("key");
        });

        it("returns the original key if it doesn't contain a colon", () => {
            const result = translateKeyIfPossible("simpleKey");

            expect(result).to.equal("simpleKey");
        });

        it("returns the original key if it's not a string", () => {
            const result = translateKeyIfPossible(null);

            expect(result).to.equal(null);
        });
    });
});
