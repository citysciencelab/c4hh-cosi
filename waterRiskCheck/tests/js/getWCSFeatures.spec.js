import {expect} from "chai";
import getWCSFeatures from "../../js/getWCSFeatures.js";
import sinon from "sinon";
import axios from "axios";
import {point} from "@turf/helpers";

describe("src/js/api/getWCSFeatures.js", () => {
    describe("getWCSPoints", () => {
        it("should return an empty array if no bbox is passed", async () => {
            expect(await getWCSFeatures.getWCSPoints()).to.be.an("array").that.is.empty;
        });
        it("should return an empty array if bbox doesnt have the length of 4", async () => {
            expect(await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow"])).to.be.an("array").that.is.empty;
            expect(await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow", "fow", "fow"])).to.be.an("array").that.is.empty;
            expect(await getWCSFeatures.getWCSPoints(undefined, "", [])).to.be.an("array").that.is.empty;
        });
        it("should reject if the response code is the range of 2xx but is not 200", async () => {
            sinon.stub(axios, "get").returns(Promise.resolve({status: 203, statusText: "foo"}));
            const expected = "Response was returned with code 203: foo";

            await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow", "fow"]).catch(error => {
                expect(error).to.be.equal(expected);
            });
            sinon.restore();
        });
        it("should resolve empty array if everything went ok but the result is empty", async () => {
            const requestStub = sinon.stub(axios, "get").returns(Promise.resolve({status: 200, data: ""}));

            expect(await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow", "fow"])).to.be.an("array").that.is.empty;
            expect(requestStub.calledOnce).to.be.true;
            sinon.restore();
        });
        it("should resolve array with geoJSON points", async () => {
            const requestStub = sinon.stub(axios, "get").returns(Promise.resolve({status: 200, data:
                    "10.0017045484644438 53.4990049814554212 32767\n10.1017045484644438 53.599004981455421 20\n\n10.2017045484644438 53.699004981455421 foo"
                })),
                expected = [
                    point(["10.1017045484644438", "53.599004981455421"], {value: 20}),
                    point(["10.2017045484644438", "53.699004981455421"], {value: "foo"})
                ];

            expect(await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow", "fow"])).to.deep.equal(expected);
            expect(requestStub.calledOnce).to.be.true;
            sinon.restore();
        });
        it("should reject with rejected error from axios", async () => {
            sinon.stub(axios, "get").returns(Promise.reject({status: 500, statusText: "whoever reads this is cool"}));
            const expected = {status: 500, statusText: "whoever reads this is cool"};

            await getWCSFeatures.getWCSPoints(undefined, "", ["foo", "bar", "fow", "fow"]).catch(error => {
                expect(error).to.deep.equal(expected);
            });
            sinon.restore();
        });
    });
});
