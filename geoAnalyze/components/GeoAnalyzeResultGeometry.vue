<script>
export default {
    name: "GeoAnalyzeResultGeometry",
    props: {
        results: {
            type: Object,
            required: true
        }
    },
    computed: {
        sum_ew_haupt: function () {
            return this.results?.ew?.[0]?.sum_ew_haupt || "keine Daten vorhanden";
        },
        sum_ew_neben: function () {
            return this.results?.ew?.[0]?.sum_ew_neben || "keine Daten vorhanden";
        },
        schools_sum: function () {
            return this.results?.schools?.[0]?.sum_schulen || "keine Daten vorhanden";
        },
        students_sum: function () {
            return this.results?.schools?.[0]?.sum_schueler || "keine Daten vorhanden";
        },
        sum_kita: function () {
            return this.results?.kitas?.[0]?.sum_kita || "keine Daten vorhanden";
        },
        sum_children: function () {
            return this.results?.kitas?.[0]?.sum_kinder || "keine Daten vorhanden";
        },
        sum_hospitals: function () {
            return this.results?.hospitals?.[0]?.sum_krankenhaus || "keine Daten vorhanden";
        },
        sum_hospitals_beds: function () {
            return this.results?.hospitals?.[0]?.sum_planbetten || "keine Daten vorhanden";
        },
        sum_care_facility: function () {
            return this.results?.pflege?.[0]?.sum_pflege || "keine Daten vorhanden";
        },
        sum_care_places: function () {
            return this.results?.pflege?.[0]?.sum_plaetze || "keine Daten vorhanden";
        }
    }
};
</script>

<template lang="html">
    <div>
        <dl class="dl-horizontal row">
            <dt class="col-6 d-flex justify-content-end">
                Einwohnerzahl Hauptsitz gesamt:
            </dt>
            <dd class="col-6">
                {{ sum_ew_haupt }}
            </dd>
            <dt class="col-6 d-flex justify-content-end">
                Einwohnerzahl Nebensitz gesamt:
            </dt>
            <dd class="col-6">
                {{ sum_ew_neben }}
            </dd>
        </dl>
        <hr>
        <dl class="dl-horizontal row">
            <dt class="col-6 d-flex justify-content-end">
                Summe der Schulen:
            </dt>
            <dd class="col-6">
                {{ schools_sum }}
            </dd>
            <dt class="col-6 d-flex justify-content-end">
                Summe der Schüler:
            </dt>
            <dd class="col-6">
                {{ students_sum }}
            </dd>
        </dl>
        <hr>
        <dl class="dl-horizontal row">
            <dt class="col-6 d-flex justify-content-end">
                Summe der Kitas:
            </dt>
            <dd class="col-6">
                {{ sum_kita }}
            </dd>
            <dt class="col-6 d-flex justify-content-end">
                Summe der Kinder:
            </dt>
            <dd class="col-6">
                {{ sum_children }}
            </dd>
        </dl>
        <hr>
        <dl class="dl-horizontal row">
            <dt class="col-6 d-flex justify-content-end">
                Summe der Krankenhäuser:
            </dt>
            <dd class="col-6">
                {{ sum_hospitals }}
            </dd>
            <dt class="col-6 d-flex justify-content-end">
                Summe der Planbetten:
            </dt>
            <dd class="col-6">
                {{ sum_hospitals_beds }}
            </dd>
        </dl>
        <hr>
        <dl class="dl-horizontal row">
            <dt class="col-6 d-flex justify-content-end">
                Summe der Pflegeeinrichtungen:
            </dt>
            <dd class="col-6">
                {{ sum_care_facility }}
            </dd>
            <dt class="col-6 d-flex justify-content-end">
                Summe der Pflegeplätze:
            </dt>
            <dd class="col-6">
                {{ sum_care_places }}
            </dd>
        </dl>
    </div>
</template>

<style lang="scss" scoped>
    hr {
        margin-top: 10px;
        margin-bottom: 10px;
    }
    .dl-horizontal {
        dd {
            margin-bottom: 0;
        }
        dt {
            font-family: "MasterPortalFont Bold", "Arial Narrow", Arial, sans-serif;
        }
    }
</style>
