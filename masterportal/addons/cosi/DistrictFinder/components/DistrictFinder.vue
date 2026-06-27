<script>
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import DistrictFinderFilter from "./DistrictFinderFilter.vue";
import DistrictFinderSelector from "./DistrictFinderSelector.vue";
import getters from "../store/gettersDistrictFinder";
import {mapGetters, mapMutations} from "vuex";
import {prepareDistrictLevels} from "../../DistrictSelector/utils/prepareDistrictLevels";

export default {
    name: "DistrictFinder",
    components: {
        AccordionItem,
        DistrictFinderFilter,
        DistrictFinderSelector,
        ToolInfo
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels"]),
        ...mapGetters("Modules/DistrictFinder", Object.keys(getters))
    },
    created () {
        prepareDistrictLevels(this.districtLevels, mapCollection.getMap("2D").getLayers().getArray());
    },

    methods: {
        ...mapMutations("Modules/DistrictFinder", ["setActive"])
    }
};
</script>

<template lang="html">
    <div
        id="district-finder"
        class="container"
    >
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.tools.cosi.districtFinder.description')"
        />
        <AccordionItem
            id="district-selection"
            :title="$t('additional:modules.tools.cosi.districtFinder.selector.title')"
            :title-badge="selectedDistricts.length"
        >
            <DistrictFinderSelector />
        </AccordionItem>
        <hr class="my-2 mx-0 text-black-50">
        <DistrictFinderFilter />
    </div>
</template>
