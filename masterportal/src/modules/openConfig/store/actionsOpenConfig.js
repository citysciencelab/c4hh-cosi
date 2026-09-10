import layerCollection from "@core/layers/js/layerCollection.js";
import {mainMenu, secondaryMenu, treeTopicConfigKey} from "@shared/js/utils/constants.js";

const actions = {

    /**
     * Processes the config.json on file load. Checks for existing section entries and alerts success to user.
     * @param {Object} context the vue context
     * @param {Object} context.commit the commit
     * @param {Object} context.dispatch the dispatch
     * @param {Object} payload the payload
     * @param {Progressevent} payload.event Event contains the loaded file
     * @param {Object} payload.targetFileName the name of the loaded file
     * @returns {void}
     */
    processConfigJsonOnload ({commit, dispatch}, {event, targetFileName}) {
        const configJson = JSON.parse(event.target.result),
            notAvailableModules = [],
            successMsg = i18next.t("common:modules.openConfig.loadFileSuccess", {targetFileName});

        layerCollection.clear();
        commit("setPortalConfig", configJson.portalConfig, {root: true});
        Object.keys(configJson[treeTopicConfigKey]).forEach(topic => {
            commit("setLayerConfigByParentKey", {layerConfigs: configJson[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
        });
        dispatch("extendLayers", null, {root: true});
        dispatch("checkAvailabilityOfModules", {menu: configJson.portalConfig.mainMenu, notAvailableModules});
        dispatch("checkAvailabilityOfModules", {menu: configJson.portalConfig.secondaryMenu, notAvailableModules});
        commit("Menu/setSectionsBySide", {sections: configJson.portalConfig.mainMenu ? configJson.portalConfig.mainMenu.sections : [], side: mainMenu}, {root: true});
        commit("Menu/setSectionsBySide", {sections: configJson.portalConfig.secondaryMenu ? configJson.portalConfig.secondaryMenu.sections : [], side: secondaryMenu}, {root: true});
        if (notAvailableModules.length > 0) {
            const msg = i18next.t("common:modules.openConfig.modulesNotAvailable", {count: notAvailableModules.length, modules: notAvailableModules.join(", ")});

            dispatch("Alerting/addSingleAlert", {
                category: "success",
                content: successMsg + "<br>" + msg
            }, {root: true});
        }
        else {
            dispatch("Alerting/addSingleAlert", {
                category: "success",
                content: successMsg
            }, {root: true});
        }
    },

    /**
     * Checks the sections of the menu for avilability and removes not available modules from sections.
     * @param {Object} context the vue context
     * @param {Object} context.rootGetters the rootGetters
     * @param {Object} payload the payload
     * @param {Object} payload.menu the config.json menu entry
     * @param {Object} payload.notAvailableModules list to fill with not available modules
     * @returns {void}
     */
    checkAvailabilityOfModules ({rootGetters}, {menu, notAvailableModules}) {
        if (menu) {
            menu.sections.forEach((underSection, index) => {
                const availableModules = [];

                underSection.forEach(module => {
                    if (!rootGetters["Modules/componentMap"][module.type]) {
                        console.warn("openConfig: module not available", module);
                        notAvailableModules.push(module.type);
                    }
                    else {
                        availableModules.push(module);
                    }
                });
                menu.sections[index] = availableModules;
            });

        }
    }
};

export default actions;
