import {expect} from "chai";
import sinon from "sinon";
import {loadModule} from "../../../utils/loadModule.js";

describe("addons/gfiThemes/combinedGfi/utils/loadModule.js", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(global, "fetch");
    });


    it("loads and interprets a JS module", async () => {
        fetchStub.resolves(new Response(
            "module.exports = { foo: 42 };",
            {status: 200, headers: {"content-type": "application/javascript"}}
        ));

        const result = await loadModule("/js/the_answer.js");

        expect(result).to.deep.equal({foo: 42});
    });

    it("caches the module after first load", async () => {
        fetchStub.resolves(new Response(
            "module.exports = { cached: true };",
            {status: 200, headers: {"content-type": "application/javascript"}}
        ));

        const firstLoad = await loadModule("/js/cached.js"),
            secondLoad = await loadModule("/js/cached.js");

        expect(firstLoad).to.equal(secondLoad);
        expect(fetchStub.calledOnce).to.be.true;
    });

    it("throws an error if response is not ok", async () => {
        fetchStub.resolves(new Response("Not Found", {status: 404}));

        try {
            await loadModule("/js/i_hope_you_dont_have_an_typo.js");
            throw new Error("Error: Test should have thrown.");
        }
        catch (err) {
            expect(err.message).to.include("could not be loaded");
        }
    });

    it("throws an error if content is HTML", async () => {
        fetchStub.resolves(new Response(
            "<!DOCTYPE html><html></html>",
            {status: 200, headers: {"content-type": "text/html"}}
        ));

        try {
            await loadModule("/html/index.html");
            throw new Error("Test failed: should have thrown");
        }
        catch (err) {
            expect(err.message).to.include("Received HTML instead of JavaScript");
        }
    });

    it("throws an error if content is empty", async () => {
        fetchStub.resolves(new Response(
            "",
            {status: 200, headers: {"content-type": "application/javascript"}}
        ));

        try {
            await loadModule("/empty/module.js");
            throw new Error("Test failed: should have thrown.");
        }
        catch (err) {
            expect(err.message).to.include("Received empty content");
        }
    });
});
