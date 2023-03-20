<script>

export default {
    name: "FloorComponent",
    props: {
        title: {
            type: String,
            required: true
        },
        feature: {
            type: Object,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        landuse: {
            type: String,
            required: true
        }
    }
};
</script>

<template>
    <div class="floor-component">
        <h4>{{ title }} </h4>
        <span> {{ label }} </span>
        <br>
        <br>
        <div
            v-if="feature.schichtwerte"
            class="floorvalue-part-I"
        >
            <div
                v-for="(schichtwert, index) in feature.schichtwerte"
                :key="index"
            >
                <h5 v-if="schichtwert.geschoss === '3. Obergeschoss oder höher'">
                    {{ $t("additional:modules.tools.boris.floorValues.third") }}
                </h5>
                <h5 v-else-if="schichtwert.geschoss === '2. Obergeschoss'">
                    {{ $t("additional:modules.tools.boris.floorValues.second") }}
                </h5>
                <h5 v-else-if="schichtwert.geschoss === '1. Obergeschoss'">
                    {{ $t("additional:modules.tools.boris.floorValues.first") }}
                </h5>
                <h5 v-else>
                    {{ $t("additional:modules.tools.boris.floorValues.ground") }}
                </h5>
                <dl>
                    <dt>{{ $t("additional:modules.tools.boris.floorValues.wgfz") }}</dt>
                    <dd>{{ schichtwert.wgfz }}</dd>
                    <dt>{{ $t("additional:modules.tools.boris.floorValues.usage") }}</dt>
                    <dd>{{ schichtwert.nutzung }}</dd>
                    <dt>{{ $t("additional:modules.tools.boris.floorValues.floorValue") }}</dt>
                    <dd
                        v-if="schichtwert.schichtwertDM === ''"
                    >
                        {{ schichtwert.schichtwert }} €/m² WGF
                    </dd>
                    <dd
                        v-else
                    >
                        <span>{{ schichtwert.schichtwert }} €/m² WGF</span><span class="d-flex justify-content-end"> {{ schichtwert.schichtwertDM }} DM/m² WGF</span>
                    </dd>
                </dl>
            </div>
        </div>
        <div
            v-else
            class="floorvalue-part-II"
        >
            <dl>
                <dt v-if="landuse === 'GH Geschäftshäuser (mehrgeschossig, Wertanteil Erdgeschoss)'">
                    {{ $t("additional:modules.tools.boris.floorValues.valueLanduse") }} {{ $t("additional:modules.tools.boris.floorValues.commercial") }}:
                </dt>
                <dt v-else-if="landuse === 'MFH Mehrfamilienhäuser'">
                    {{ $t("additional:modules.tools.boris.floorValues.valueLanduse") }} {{ $t("additional:modules.tools.boris.floorValues.apartment") }}:
                </dt>
                <dt v-else>
                    {{ $t("additional:modules.tools.boris.floorValues.valueLanduse") }} {{ $t("additional:modules.tools.boris.floorValues.office") }}:
                </dt>
                <dd v-if="Object.values(feature)[1] === undefined">
                    <span>
                        {{ $t("additional:modules.tools.boris.floorValues.noValue") }}
                    </span>
                </dd>
                <dd v-else-if="Object.values(feature)[2] === ''">
                    <span> {{ Object.values(feature)[1] }} €/m²</span>
                </dd>
                <dd v-else>
                    <span> {{ Object.values(feature)[1] }} €/m²</span>
                    <span class="d-flex justify-content-end">{{ Object.values(feature)[2] }} DM/m²</span>
                </dd>
            </dl>
        </div>
    </div>
</template>

<style  lang="scss" scoped>
h5 {
    font-weight: bolder;
};
</style>
