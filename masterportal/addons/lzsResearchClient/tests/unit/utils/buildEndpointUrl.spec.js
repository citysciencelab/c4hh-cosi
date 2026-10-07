import {expect} from "chai";
import {buildEndpointUrl} from "../../../utils/buildEndpointUrl.js";

/**
 * Run only these tests via command:
 * npm run test:watch -- --grep="addons/lzsResearchClient/test/ Build Endpoint URL"
 */
describe("addons/lzsResearchClient/test/ Build Endpoint URL", () => {
    it("should build correct endpoint URL for given base url and query parameters.", () => {
        const
            url = "/test-endpoint-1/",
            query = {
                "test_string": "1-2-3",
                "test_id": 654,
                "test_group_by[date]": null,
                "test_aggregate[Sum]": "test_visitors",
                "test_bool_false": false,
                "test_bool_true": true
            },
            endpointUrl = buildEndpointUrl(url, query),
            endpointUrlExpectedOutput = encodeURI("/test-endpoint-1/?test_string=1-2-3&test_id=654&test_group_by[date]=&test_aggregate[Sum]=test_visitors&test_bool_false=false&test_bool_true=true");

        expect(endpointUrl).to.equal(endpointUrlExpectedOutput);
    });

    it("should build correct endpoint URL for given base url and missing or malformed query parameters.", () => {
        const
            url = "/test-endpoint-2/",
            query = {},
            endpointUrl = buildEndpointUrl(url, query),
            endpointUrlWithWrongQuery = buildEndpointUrl(url, "test"),
            endpointUrlWithoutQuery = buildEndpointUrl(url),
            endpointUrlExpectedOutput = encodeURI("/test-endpoint-2/");

        expect(endpointUrl).to.equal(endpointUrlExpectedOutput);
        expect(endpointUrlWithWrongQuery).to.equal(endpointUrlExpectedOutput);
        expect(endpointUrlWithoutQuery).to.equal(endpointUrlExpectedOutput);
    });

    it("should build correct endpoint URL for given base url with query parameters.", () => {
        const query = {
                "test_string": "1-2-3",
                "test_id": 654
            },
            endpointUrl = buildEndpointUrl("/test-endpoint-2/?alreadyThere=true", query),
            endpointUrlWithAnd = buildEndpointUrl("/test-endpoint-2/?alreadyThere=true&foo=bar", query),
            endpointUrlExpectedOutput = encodeURI("/test-endpoint-2/?alreadyThere=true&test_string=1-2-3&test_id=654"),
            endpointUrlWithAndExpectedOutput = encodeURI("/test-endpoint-2/?alreadyThere=true&foo=bar&test_string=1-2-3&test_id=654");

        expect(endpointUrl).to.equal(endpointUrlExpectedOutput);
        expect(endpointUrlWithAnd).to.equal(endpointUrlWithAndExpectedOutput);
    });
});
