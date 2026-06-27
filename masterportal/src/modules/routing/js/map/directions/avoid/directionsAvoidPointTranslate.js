import {Translate} from "ol/interaction.js";
import directionsAvoidPointLayer from "./directionsAvoidPointLayer.js";

export default new Translate({layers: [directionsAvoidPointLayer]});
