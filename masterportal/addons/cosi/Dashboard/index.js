import Dashboard from "./components/Dashboard.vue";
import DashboardStore from "./store/indexDashboard";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: Dashboard,
    store: DashboardStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
