import {expect} from "chai";
import sinon from "sinon";
import {createObjectSetters, createValueSetters} from "@modules/draw/js/createGuardedSetters.js";

describe("src/modules/draw/js/createGuardedSetters.js", () => {
    let commit;

    beforeEach(() => {
        commit = sinon.spy();
    });

    describe("createObjectSetters", () => {
        it("positive: creates one method per name, named 'set' + capitalized name", () => {
            const setters = createObjectSetters(["currentLayout", "circleOptions"]);

            expect(Object.keys(setters)).to.deep.equal(["setCurrentLayout", "setCircleOptions"]);
            expect(setters.setCurrentLayout).to.be.a("function");
        });

        it("positive: commits only the changed entries to the namespaced mutation", () => {
            const {setCurrentLayout} = createObjectSetters(["currentLayout"]),
                context = {currentLayout: {fillColor: "red", strokeWidth: 2}, $store: {commit}};

            setCurrentLayout.call(context, {fillColor: "red", strokeWidth: 5});

            expect(commit.calledOnce).to.be.true;
            expect(commit.calledWith("Modules/Draw/setCurrentLayout", {strokeWidth: 5})).to.be.true;
        });

        it("negative: does not commit if no entry differs", () => {
            const {setCurrentLayout} = createObjectSetters(["currentLayout"]),
                context = {currentLayout: {fillColor: "red"}, $store: {commit}};

            setCurrentLayout.call(context, {fillColor: "red"});

            expect(commit.called).to.be.false;
        });

        it("negative: does not commit if options are undefined", () => {
            const {setCurrentLayout} = createObjectSetters(["currentLayout"]),
                context = {currentLayout: {fillColor: "red"}, $store: {commit}};

            setCurrentLayout.call(context, undefined);

            expect(commit.called).to.be.false;
        });
    });

    describe("createValueSetters", () => {
        it("positive: creates one method per name, named 'set' + capitalized name", () => {
            const setters = createValueSetters(["selectedDrawType", "selectedSymbol"]);

            expect(Object.keys(setters)).to.deep.equal(["setSelectedDrawType", "setSelectedSymbol"]);
            expect(setters.setSelectedDrawType).to.be.a("function");
        });

        it("positive: commits the new value to the namespaced mutation if it differs", () => {
            const {setSelectedDrawType} = createValueSetters(["selectedDrawType"]),
                context = {selectedDrawType: "line", $store: {commit}};

            setSelectedDrawType.call(context, "circle");

            expect(commit.calledOnce).to.be.true;
            expect(commit.calledWith("Modules/Draw/setSelectedDrawType", "circle")).to.be.true;
        });

        it("positive: commits falsy values like an empty string if they differ", () => {
            const {setSelectedDrawType} = createValueSetters(["selectedDrawType"]),
                context = {selectedDrawType: "line", $store: {commit}};

            setSelectedDrawType.call(context, "");

            expect(commit.calledWith("Modules/Draw/setSelectedDrawType", "")).to.be.true;
        });

        it("negative: does not commit if the value is unchanged", () => {
            const {setSelectedDrawType} = createValueSetters(["selectedDrawType"]),
                context = {selectedDrawType: "line", $store: {commit}};

            setSelectedDrawType.call(context, "line");

            expect(commit.called).to.be.false;
        });
    });
});
