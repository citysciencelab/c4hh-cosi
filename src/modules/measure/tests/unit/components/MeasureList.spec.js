import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import MeasureList from "@modules/measure/components/MeasureList.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

describe("src/modules/measure/components/MeasureList.vue", function () {
    const defaultMeasurement = {
        id: "10",
        type: "LineString",
        displayValue: "100 m",
        customName: null,
        canUndo: false,
        canRedo: false
    };

    /**
     * Mounts MeasureList with default props, overridable via propsData.
     * @param {Object} propsData - Props to merge into defaults
     * @returns {Object} mounted wrapper (VueWrapper)
     */
    function mountList (propsData = {}) {
        return shallowMount(MeasureList, {
            props: {
                measurementList: [defaultMeasurement],
                ...propsData
            }
        });
    }

    /**
     * Finds a stubbed IconButton by its id prop and returns its interaction function.
     * @param {Object} wrapper - VTU wrapper
     * @param {string} id - the id prop on the IconButton
     * @returns {Function} the interaction function
     */
    function getButtonInteraction (wrapper, id) {
        const btn = wrapper.findAllComponents(IconButton)
            .find(c => c.attributes("id") === id);

        return btn ? btn.props("interaction") : null;
    }

    describe("rendering", function () {
        it("renders a list item for each measurement", function () {
            const wrapper = mountList();

            expect(wrapper.findAll(".measure-list-item")).to.have.length(1);
        });

        it("renders the display value", function () {
            const wrapper = mountList();

            expect(wrapper.find(".measure-item-value").text()).to.equal("100 m");
        });

        it("uses type label as aria-label when no customName is set", function () {
            const wrapper = mountList();
            const item = wrapper.find(".measure-list-item");

            expect(item.attributes("aria-label")).to.include("common:modules.measure.lineString");
        });

        it("uses customName in aria-label when set", function () {
            const measurement = {...defaultMeasurement, customName: "Meine Strecke"};
            const wrapper = mountList({measurementList: [measurement]});

            expect(wrapper.find(".measure-list-item").attributes("aria-label")).to.include("Meine Strecke");
        });

        it("shows active measurement section when activeMeasurement prop is set", function () {
            const wrapper = mountList({
                activeMeasurement: {type: "LineString", displayValue: "50 m"}
            });

            expect(wrapper.find(".active-measurement-container").exists()).to.be.true;
        });

        it("hides active measurement section when activeMeasurement is null", function () {
            const wrapper = mountList({activeMeasurement: null});

            expect(wrapper.find(".active-measurement-container").exists()).to.be.false;
        });

        it("renders line icon for LineString type", function () {
            const wrapper = mountList();

            expect(wrapper.find(".measure-item-type i").classes()).to.include("bi-rulers");
        });

        it("renders area icon for Polygon type", function () {
            const measurement = {...defaultMeasurement, type: "Polygon"};
            const wrapper = mountList({measurementList: [measurement]});

            expect(wrapper.find(".measure-item-type i").classes()).to.include("bi-bounding-box");
        });
    });

    describe("emit behavior", function () {
        it("emits highlight-feature on mouseenter", async function () {
            const wrapper = mountList();

            await wrapper.find(".measure-list-item").trigger("mouseenter");

            expect(wrapper.emitted("highlight-feature")).to.exist;
            expect(wrapper.emitted("highlight-feature")[0]).to.deep.equal(["10"]);
        });

        it("emits unhighlight-feature on mouseleave", async function () {
            const wrapper = mountList();

            await wrapper.find(".measure-list-item").trigger("mouseleave");

            expect(wrapper.emitted("unhighlight-feature")).to.exist;
            expect(wrapper.emitted("unhighlight-feature")[0]).to.deep.equal(["10"]);
        });

        it("emits undo-action when undo button interaction is called", function () {
            const measurement = {...defaultMeasurement, canUndo: true};
            const wrapper = mountList({measurementList: [measurement]});

            getButtonInteraction(wrapper, `measure-item-undo-${measurement.id}`)();

            expect(wrapper.emitted("undo-action")).to.exist;
            expect(wrapper.emitted("undo-action")[0]).to.deep.equal([measurement.id]);
        });

        it("emits redo-action when redo button interaction is called", function () {
            const measurement = {...defaultMeasurement, canRedo: true};
            const wrapper = mountList({measurementList: [measurement]});

            getButtonInteraction(wrapper, `measure-item-redo-${measurement.id}`)();

            expect(wrapper.emitted("redo-action")).to.exist;
            expect(wrapper.emitted("redo-action")[0]).to.deep.equal([measurement.id]);
        });

        it("emits modify-measurement when modify button interaction is called", function () {
            const wrapper = mountList();

            getButtonInteraction(wrapper, `measure-item-modify-${defaultMeasurement.id}`)();

            expect(wrapper.emitted("modify-measurement")).to.exist;
        });

        it("emits delete-measurement when delete button interaction is called", function () {
            const wrapper = mountList();

            getButtonInteraction(wrapper, `measure-item-delete-${defaultMeasurement.id}`)();

            expect(wrapper.emitted("delete-measurement")).to.exist;
        });

        it("emits undo-active-sketch via active measurement undo button", function () {
            const wrapper = mountList({
                activeMeasurement: {type: "LineString", displayValue: "20 m"},
                canUndoActive: true
            });

            getButtonInteraction(wrapper, "measure-active-undo")();

            expect(wrapper.emitted("undo-active-sketch")).to.exist;
        });

        it("emits redo-active-sketch via active measurement redo button", function () {
            const wrapper = mountList({
                activeMeasurement: {type: "LineString", displayValue: "20 m"},
                canRedoActive: true
            });

            getButtonInteraction(wrapper, "measure-active-redo")();

            expect(wrapper.emitted("redo-active-sketch")).to.exist;
        });
    });

    describe("disabled state", function () {
        it("undo button has disabled=true when canUndo is false", function () {
            const wrapper = mountList();
            const undoBtn = wrapper.findAllComponents(IconButton)
                .find(c => c.attributes("id") === `measure-item-undo-${defaultMeasurement.id}`);

            expect(undoBtn.props("disabled")).to.be.true;
        });

        it("undo button has disabled=false when canUndo is true", function () {
            const measurement = {...defaultMeasurement, canUndo: true};
            const wrapper = mountList({measurementList: [measurement]});
            const undoBtn = wrapper.findAllComponents(IconButton)
                .find(c => c.attributes("id") === `measure-item-undo-${measurement.id}`);

            expect(undoBtn.props("disabled")).to.be.false;
        });

        it("active sketch undo button has disabled=true when canUndoActive is false", function () {
            const wrapper = mountList({
                activeMeasurement: {type: "LineString", displayValue: "10 m"},
                canUndoActive: false
            });
            const undoBtn = wrapper.findAllComponents(IconButton)
                .find(c => c.attributes("id") === "measure-active-undo");

            expect(undoBtn.props("disabled")).to.be.true;
        });
    });

    describe("inline name editing", function () {
        it("starts editing when name span is clicked", async function () {
            const wrapper = mountList();

            await wrapper.find(".measure-item-type").trigger("click");

            expect(wrapper.vm.editingFeatureId).to.equal("10");
        });

        it("starts editing when name span receives Enter keydown", async function () {
            const wrapper = mountList();

            await wrapper.find(".measure-item-type").trigger("keydown", {key: "Enter"});

            expect(wrapper.vm.editingFeatureId).to.equal("10");
        });

        it("starts editing on Space keydown", async function () {
            const wrapper = mountList();

            await wrapper.find(".measure-item-type").trigger("keydown.space");

            expect(wrapper.vm.editingFeatureId).to.equal("10");
        });

        it("saves and emits rename-measurement on saveEditedName with non-empty name", function () {
            const wrapper = mountList();

            wrapper.vm.editingFeatureId = "10";
            wrapper.vm.editingName = "Neue Messung";
            wrapper.vm.saveEditedName("10");

            expect(wrapper.emitted("rename-measurement")).to.exist;
            expect(wrapper.emitted("rename-measurement")[0]).to.deep.equal([{featureId: "10", name: "Neue Messung"}]);
        });

        it("does not emit rename-measurement when name is only whitespace", function () {
            const wrapper = mountList();

            wrapper.vm.editingFeatureId = "10";
            wrapper.vm.editingName = "   ";
            wrapper.vm.saveEditedName("10");

            expect(wrapper.emitted("rename-measurement")).to.be.undefined;
        });

        it("resets editingFeatureId and editingName after save", function () {
            const wrapper = mountList();

            wrapper.vm.editingFeatureId = "10";
            wrapper.vm.editingName = "Test";
            wrapper.vm.saveEditedName("10");

            expect(wrapper.vm.editingFeatureId).to.be.null;
            expect(wrapper.vm.editingName).to.equal("");
        });

        it("cancelEditingName resets state without emitting", function () {
            const wrapper = mountList();

            wrapper.vm.editingFeatureId = "10";
            wrapper.vm.editingName = "Unsaved";
            wrapper.vm.cancelEditingName();

            expect(wrapper.vm.editingFeatureId).to.be.null;
            expect(wrapper.vm.editingName).to.equal("");
            expect(wrapper.emitted("rename-measurement")).to.be.undefined;
        });
    });

    describe("isModifying", function () {
        it("returns true for the feature currently being modified", function () {
            const wrapper = mountList({currentlyModifyingFeatureId: "10"});

            expect(wrapper.vm.isModifying("10")).to.be.true;
        });

        it("returns false when currentlyModifyingFeatureId is null", function () {
            const wrapper = mountList({currentlyModifyingFeatureId: null});

            expect(wrapper.vm.isModifying("10")).to.be.false;
        });

        it("returns false for a different feature ID", function () {
            const wrapper = mountList({currentlyModifyingFeatureId: "99"});

            expect(wrapper.vm.isModifying("10")).to.be.false;
        });
    });

    describe("getDisplayName", function () {
        it("returns customName when present", function () {
            const wrapper = mountList();
            const result = wrapper.vm.getDisplayName({type: "LineString", customName: "Meine Linie"});

            expect(result).to.equal("Meine Linie");
        });

        it("returns translated type label when customName is null", function () {
            const wrapper = mountList();
            const result = wrapper.vm.getDisplayName({type: "Polygon", customName: null});

            expect(result).to.equal("common:modules.measure.polygon");
        });
    });
});
