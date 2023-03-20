import "./RadioBridge.js";

const ShowParcelGFI = Backbone.Model.extend(/** @lends ShowParcelGFI.prototype */{
    defaults: {
        "requestedParcelId": false
    },

    /**
     * @class ShowParcelGFI
     * @extends Backbone.Model
     * @memberof Addons.ShowParcelGFI
     * @listens Tools.ParcelSearch#RadioRequestParcelSearchParcelFound
     * @listens Tools.GFI#RadioRequestGFIGetRequestedParcelId
     * @constructs
     */
    initialize: function () {
        Radio.on("ParcelSearch", "parcelFound", this.parcelFound, this);
        Radio.channel("GFI").reply({
            "getRequestedParcelId": function () {
                return this.get("requestedParcelId");
            }
        }, this);
    },

    /**
     * Initiates the display of the parcel GFI at the parcel position found.
     * @param   {object} attributes found object
     * @fires GFI#RadioTriggerLayerAtPosition
     * @returns {void}
     */
    parcelFound: function (attributes) {
        this.setRequestedParcelId(attributes.flurstuecksnummer);
        Radio.trigger("GFI", "layerAtPosition", "2619", attributes);
    },

    /**
     * Setter for requested parcel Id.
     * @param {String} value requested parcel id
     * @returns {void}
     */
    setRequestedParcelId: function (value) {
        this.set("requestedParcelId", value);
    }

});

export default ShowParcelGFI;
