// import Vue from "vue";
// import Vuetify from "vuetify";
// import "vuetify/dist/vuetify.min.css";
// import en from "vuetify/lib/locale/en";
// import de from "vuetify/lib/locale/de";

// Vue.use(Vuetify);

// export default new Vuetify({
//     lang: {
//         locales: {en, de},
//         current: "de"
//     }
// });

import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VChip } from 'vuetify/components/VChip'
// import { VRating } from 'vuetify/components/VRating'
// import { VToolbar } from 'vuetify/components/VToolbar'
// import { Ripple } from 'vuetify/directives'

const vuetify = createVuetify({
  components: {
    VChip
  }
})

export default vuetify