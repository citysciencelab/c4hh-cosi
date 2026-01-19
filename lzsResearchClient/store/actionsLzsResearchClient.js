import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";

export default {
    async fetchDataClassList ({state, commit}) {
        const params = {
                Token: ""
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclass/list`, params),
            response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

        commit("setDataClassList", response.data);
    },
    async searchByAttribute ({state, commit}, payload) {
        const params = {
                Token: "",
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclassinstance/search`, params),
            response = await axios.post(url, payload),
            searchAttributeResponse = [];

        response.data.forEach(element => {
            searchAttributeResponse.push({
                archiveId: element.dataclassId,
                attributes: element.dataclassinstanceAttributeArr
            });
        });

        commit("setSearchAttributeResponse", searchAttributeResponse);
    },
    async fetchPlaceholders ({state, commit}) {
        const timestamp = Date.now(),
            response = await axios.get(state.placeholderJsonPath + "?t=" + timestamp);

        commit("setPlaceholderDataClassList", response.data);
    }
};
