import store from "../../../src/app-store";

Radio.channel("addLayerRemotely").on({
    "addGeoJson": function (params) {
        store.dispatch("AddLayerRemotely/addGeoJson", params);
    },
    "addWMS": function (params) {
        store.dispatch("AddLayerRemotely/addWMS", params);
    }
});
