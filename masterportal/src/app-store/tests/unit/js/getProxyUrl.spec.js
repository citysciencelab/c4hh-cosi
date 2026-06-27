import {expect} from "chai";
import sinon from "sinon";
import {getProxyUrl, updateProxyUrl} from "@appstore/js/getProxyUrl.js";


describe("src/app-store/js/getProxyUrl.js", () => {
    beforeEach(() => {
        sinon.stub(console, "warn");
    });

    describe("getProxyUrl", () => {
        it("should generate key without hostname from url", function () {

            expect(getProxyUrl("https://dies.ist.ein.test/PFAD_ZU_TEST-QUELLE")).to.be.equal("/dies_ist_ein_test/PFAD_ZU_TEST-QUELLE");
        });

        it("should generate key with hostname from url", function () {
            const url = "https://dies.ist.ein.test/PFAD_ZU_TEST-QUELLE",
                proxyHost = "https://test-proxy.example.com";

            expect(getProxyUrl(url, proxyHost)).to.be.equal("https://test-proxy.example.com/dies_ist_ein_test/PFAD_ZU_TEST-QUELLE");
        });
        it("shouldn't transform url for local resources I", function () {
            const url = "http://localhost/test.json",
                proxyHost = "https://test-proxy.example.com";

            expect(getProxyUrl(url, proxyHost)).to.be.equal("http://localhost/test.json");
        });
        it("shouldn't transform url for local resources II", function () {
            const url = "./test.json",
                proxyHost = "https://test-proxy.example.com";

            expect(getProxyUrl(url, proxyHost)).to.be.equal("./test.json");
        });
    });

    describe("updateProxyUrl", () => {
        it("replaces the url if useProxy is set in object", function () {
            const url = "https://test.proxyurl.de/folder/",
                testproxyObject = {
                    url: url,
                    useProxy: true,
                    fetchBroadcastUrl: "./resources/newsFeedPortalAlerts.json"
                };

            updateProxyUrl(testproxyObject);

            expect(testproxyObject.url).to.be.equal("/test_proxyurl_de/folder/");
            expect(testproxyObject.origUrl).to.be.equal(url);
        });
        it("returns the upperCase url if useProxy is set in object", async function () {
            const url = "https://test.proxyURL.de/folder/",
                testproxyObject = {
                    url: "https://test.proxyURL.de/folder/",
                    useProxy: true,
                    fetchBroadcastUrl: "./resources/newsFeedPortalAlerts.json"
                },
                testobj = await updateProxyUrl(testproxyObject);

            expect(testobj.url).to.be.equal("/test_proxyURL_de/folder/");
            expect(testproxyObject.origUrl).to.be.equal(url);
        });
        it("replaces the url if useProxy is set in nested array", async function () {
            const url = "https://test.proxyurl.de/folder/",
                testproxyObject = {
                    testproxyArray: [{url: url, useProxy: true}, {url: "https://test.proxyurl.de/folder2/", useProxy: false}, {url: "https://test.proxyurl.de/folder3/", useProxy: false}]
                },
                testobj = await updateProxyUrl(testproxyObject);

            if (testobj.length === testproxyObject.testproxyArray.length) {
                expect(testobj[0].url).to.be.equal("/test_proxyurl_de/folder/");
                expect(testobj[0].origUrl).to.be.equal(url);
            }
        });
        it("does nothing, if useProxy is false", function () {
            const url = "https://test.proxyurl.de/folder/",
                testproxyObject = {
                    url: url,
                    useProxy: false
                };

            updateProxyUrl(testproxyObject);

            expect(testproxyObject.url).to.be.equal(url);
            expect(testproxyObject.origUrl).to.be.undefined;
        });
    });
});
