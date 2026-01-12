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
    }
};
