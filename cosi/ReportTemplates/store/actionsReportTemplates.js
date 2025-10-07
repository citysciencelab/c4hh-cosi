import validateToolSettings from "../utils/validateToolSettings";
const actions = {
    startEditingToolSettings (context, payload) {
        if (!payload.toolName) {
            throw new Error("Kein tool zum bearbeiten gewählt");

        }

        const toolName = String(payload.toolName).charAt(0).toLowerCase() + String(payload.toolName).slice(1);

        // close all other tools and stop their editing mode
        context.dispatch("returnToReportTemplatesInterface");
        // open selected tool in editing mode
        context.commit("Modules/" + payload.toolName + "/setReportTemplateMode", payload.templateItemsIndex, {root: true});
        context.dispatch("Menu/changeCurrentComponent", {type: toolName, side: "secondaryMenu", props: {name: "additional:modules.tools.cosi." + toolName + ".title"}}, {root: true});
        // remember which tool we are editing for which chapter
        context.state.editingTool = {toolName: toolName, templateItemsIndex: payload.templateItemsIndex};
        // close report templates window
        context.state.active = false;
    },
    finishEditingToolSettings (context) {
        // get current settings via toolbridge
        const currentSettings = context.rootGetters["Modules/ToolBridge/currentSettings"],
            settings = currentSettings(context.state.editingTool.toolName),
            //      console.log("SETTINGS ", settings);
            // check if settings are valid
            //       console.log(currentSettings(state.editingTool.toolName));
            validation = validateToolSettings(context.state.editingTool.toolName, settings);

        // if no success, let caller know and stop:
        if (!validation.success) {
            return validation;
        }
        // stop editing mode
        context.dispatch("returnToReportTemplatesInterface");
        // let reportTemplates know that editing is over and edits are accepted
        context.state.editingTool = {toolName: null, templateItemsIndex: null, accepted: true}; // watcher on editingTool handles rest
        return validation;
    },
    abortEditingToolSettings (context) {
        // stop editing mode
        context.dispatch("returnToReportTemplatesInterface");
        // let reportTemplates know that editing is over but edits are not accepted
        context.state.editingTool = {toolName: null, templateItemsIndex: null, accepted: false}; // watcher on editingTool handles rest
    },
    returnToReportTemplatesInterface (context) {
        // close all tools and stop their editing mode
        for (const i in context.state.supportedTools) {
            context.commit("Modules/" + context.state.supportedTools[i].value + "/setReportTemplateMode", null, {root: true});
            context.dispatch("Menu/changeCurrentComponent", {type: "reportTemplates", side: "secondaryMenu", props: {name: "additional:modules.cosi.reportTemplates.title"}}, {root: true});
        }
        // remember that we are not editing any tool for any chapter right now
        // return to reporttemplates window
        context.state.active = true;
    }
};

export default actions;
