import {generateSimpleMutations} from "@shared/js/utils/generators";
import stateQuickResponseCode from "./stateQuickResponseCode";

export default {
    ...generateSimpleMutations(stateQuickResponseCode),
    setEvtCoordinate (state, clickEvent) {
        state.evtCoordinate = clickEvent?.coordinate;
    }
};
