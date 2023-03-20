
import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import sdpAddonState from "./stateSdpDownload";

const getters = {
    ...generateSimpleGetters(sdpAddonState)
};

export default getters;
