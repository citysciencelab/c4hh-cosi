<script>
import DetailComponent from "./DetailComponent.vue";

export default {
    name: "InformationComponent",
    components: {
        DetailComponent
    },
    props: {
        title: {
            type: String,
            required: true
        },
        selectedBrwFeature: {
            type: Object,
            required: true
        },
        buttonValue: {
            type: String,
            required: true
        }
    }
};
</script>

<template>
    <div class="information-component">
        <div
            v-if="buttonValue === 'info'"
            class="information-info"
        >
            <h4>{{ title }}</h4>
            <dl>
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['entwicklungszustand']"
                    :label="$t('additional:modules.tools.boris.detailInformation.state')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['beitragszustand']"
                    :label="$t('additional:modules.tools.boris.detailInformation.condition')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['sanierungszusatz']"
                    :label="$t('additional:modules.tools.boris.detailInformation.developmentAddition')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['nutzung_kombiniert']"
                    :label="$t('additional:modules.tools.boris.detailInformation.typeOfUse')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['anbauart']"
                    :label="$t('additional:modules.tools.boris.detailInformation.landUse')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['geschossfl_zahl']"
                    :label="$t('additional:modules.tools.boris.detailInformation.numberOfFloor')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['grdstk_flaeche']"
                    :label="$t('additional:modules.tools.boris.detailInformation.landArea')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['grdstk_tiefe']"
                    :label="$t('additional:modules.tools.boris.detailInformation.propertyDepth')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['bemerkung']"
                    :label="$t('additional:modules.tools.boris.detailInformation.moreFeatures')"
                />
                <div
                    v-if="parseInt(selectedBrwFeature.get('jahrgang'), 10) >= 2002"
                >
                    <dt>{{ $t("additional:modules.tools.boris.landValue") }}:</dt>
                    <dd>{{ selectedBrwFeature.get('richtwert_euro') }} €/m²</dd>
                </div>
                <div
                    v-else
                >
                    <dt>{{ $t("additional:modules.tools.boris.landValue") }}:</dt>
                    <dd>
                        <span>{{ selectedBrwFeature.get('richtwert_euro') }} €/m²</span>
                        <span class="d-flex justify-content-end">{{ selectedBrwFeature.get('richtwert_dm') }} DM/m²</span>
                    </dd>
                </div>
            </dl>
        </div>
        <div
            v-if="buttonValue === 'lage'"
            class="information-position"
        >
            <h4>{{ title }}</h4>
            <dl>
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['postleitzahl', 'gemeinde']"
                    :label="$t('additional:modules.tools.boris.locationDescription.codeCity')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['bezirk']"
                    :label="$t('additional:modules.tools.boris.locationDescription.district')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['stadtteil']"
                    :label="$t('additional:modules.tools.boris.locationDescription.cityDistrict')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['statistisches_gebiet']"
                    :label="$t('additional:modules.tools.boris.locationDescription.statisticalArea')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['baublock']"
                    :label="$t('additional:modules.tools.boris.locationDescription.buildingBlock')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['strassenname', 'hausnummer', 'hausnummerzusatz']"
                    :label="$t('additional:modules.tools.boris.locationDescription.address')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['lagebezeichnung']"
                    :label="$t('additional:modules.tools.boris.locationDescription.furtherLocation')"
                />
                <DetailComponent
                    :feature="selectedBrwFeature"
                    :keys="['bezeichnung_sanierungsgebiet']"
                    :label="$t('additional:modules.tools.boris.locationDescription.redevelopmentArea')"
                />
            </dl>
        </div>
    </div>
</template>
