import {expect} from "chai";
import sinon from "sinon";
import {isCanvasEmpty, getBase64FromWebGLCanvas} from "@modules/print/utils/buildHeatmapPng.js";

describe("src/modules/print/utils/buildHeatmapPng.js", function () {
    describe("isCanvasEmpty", function () {
        it("should return true if all pixels are empty", function () {
            const canvas = {width: 2, height: 1},
                gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => pixels)
                };

            const result = isCanvasEmpty(gl, canvas);

            expect(result).to.be.true;
            expect(gl.readPixels.calledOnce).to.be.true;
        });

        it("should return false if at least one pixel channel is not empty", function () {
            const canvas = {width: 2, height: 1},
                gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => {
                        pixels[0] = 255;
                    })
                };

            const result = isCanvasEmpty(gl, canvas);

            expect(result).to.be.false;
            expect(gl.readPixels.calledOnce).to.be.true;
        });

        it("should return false if alpha channel is not empty", function () {
            const canvas = {width: 2, height: 1},
                gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => {
                        pixels[3] = 1;
                    })
                };

            const result = isCanvasEmpty(gl, canvas);

            expect(result).to.be.false;
            expect(gl.readPixels.calledOnce).to.be.true;
        });

        it("should call readPixels with expected arguments", function () {
            const canvas = {width: 3, height: 2},
                gl = {
                    RGBA: "RGBA_CONST",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE_CONST",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => pixels)
                };

            isCanvasEmpty(gl, canvas);

            const args = gl.readPixels.firstCall.args;

            expect(args[0]).to.equal(0);
            expect(args[1]).to.equal(0);
            expect(args[2]).to.equal(3);
            expect(args[3]).to.equal(2);
            expect(args[4]).to.equal("RGBA_CONST");
            expect(args[5]).to.equal("UNSIGNED_BYTE_CONST");
            expect(args[6]).to.be.instanceOf(Uint8Array);
            expect(args[6].length).to.equal(4 * 3 * 2);
        });

        it("should return true for 0x0 canvas", function () {
            const canvas = {width: 0, height: 0},
                gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => pixels)
                };

            const result = isCanvasEmpty(gl, canvas);

            expect(result).to.equal(true);
            expect(gl.readPixels.calledOnce).to.equal(true);
        });
    });
    describe("getBase64FromWebGLCanvas", function () {
        it("should return null and log an error if WebGL is not supported", function () {
            const canvas = {
                    getContext: sinon.stub().withArgs("webgl").returns(null)
                },
                consoleErrorStub = sinon.stub(console, "error");

            const result = getBase64FromWebGLCanvas(canvas);

            expect(result).to.equal(null);
            expect(consoleErrorStub.calledOnce).to.be.true;
        });

        it("should resolve 'empty' if canvas is empty", async function () {
            const gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => pixels)
                },
                canvas = {
                    width: 2,
                    height: 1,
                    getContext: sinon.stub().withArgs("webgl").returns(gl),
                    toDataURL: sinon.stub().returns("data:image/png;base64,abc")
                };

            const result = await getBase64FromWebGLCanvas(canvas);

            expect(result).to.equal("empty");
            expect(gl.readPixels.calledOnce).to.be.true;
            expect(canvas.toDataURL.called).to.be.false;
        });

        it("should resolve a base64 png string if canvas is not empty", async function () {
            const gl = {
                    RGBA: "RGBA",
                    UNSIGNED_BYTE: "UNSIGNED_BYTE",
                    readPixels: sinon.spy((x, y, w, h, format, type, pixels) => {
                        pixels[0] = 1;
                    })
                },
                expectedDataUrl = "data:image/png;base64,abc123",
                canvas = {
                    width: 2,
                    height: 1,
                    getContext: sinon.stub().withArgs("webgl").returns(gl),
                    toDataURL: sinon.stub().withArgs("image/png").returns(expectedDataUrl)
                };

            const result = await getBase64FromWebGLCanvas(canvas);

            expect(result).to.equal(expectedDataUrl);
            expect(gl.readPixels.calledOnce).to.be.true;
            expect(canvas.toDataURL.calledOnceWithExactly("image/png")).to.be.true;
        });
    });
});
