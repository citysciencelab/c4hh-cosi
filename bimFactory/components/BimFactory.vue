<script>
import getters from "../store/gettersBimFactory";
import {mapGetters, mapMutations} from "vuex";
import BimFactoryStartpage from "./BimFactoryStartpage.vue";

export default {
    name: "BimFactory",
    components: {
        BimFactoryStartpage
    },
    computed: {
        ...mapGetters("Modules/BimFactory", Object.keys(getters))
    },
    mounted () {
        this.setCurrentMenuWidth({side: this.$parent.side, width: "35%"});
        this.removeTitlesFromDOM();
    },
    unmounted () {
        this.setCurrentMenuWidth({side: this.$parent.side, width: "25%"});
    },
    methods: {
        ...mapMutations("Menu", ["setCurrentMenuWidth"]),
        removeTitlesFromDOM () {
            if (this.standAlonePortal && document.querySelector("#mp-subHeader-mainMenu")) {
                // hide title of portal and increase logo size
                document.querySelector("a#mp-menu-logo-mainMenu>h1").style.display = "none";
                document.querySelector("a#mp-menu-logo-mainMenu>img").style.width = "100%";
                document.querySelector("a#mp-menu-logo-mainMenu>img").style["max-height"] = "none";
            }
            else {
                // hide title of addon in right sidebar, when it is opened, because the Startpage will display the logo
                document.querySelector("div#mp-menu-navigation-secondaryMenu>h4").style.display = "none";
            }
        }
    }
};
</script>

<template>
    <div>
        <BimFactoryStartpage />
    </div>
</template>
