import actions from "./actionsDrawWithoutGui.js";
import store from "@appstore/index.js";

store.$app.config.globalProperties.$remoteInterface.sendMessage({"initDrawTool": true});

export default {
    namespaced: true,
    actions
};
