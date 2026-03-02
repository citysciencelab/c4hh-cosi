import "./styles.css"; // Wraps Vuetify styles in a css layer to prevent conflicts with other styles in the application
import {createVuetify} from "vuetify";
import "@mdi/font/css/materialdesignicons.css";

const vuetify = createVuetify({
    components: {}, // For maximum tree-shaking, no global registration of Vuetify components, they will be imported and registered locally in the components where they are used
    directives: {}, // Same for directives
    theme: {
        layers: true // Enable CSS layers for Vuetify styles. The actual styles are wrapped in a layer in cosiVuetifyStyles.css
    }
});

export default vuetify;
