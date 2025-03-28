const mongoose = require("mongoose");

const engineerRemarksSchema = new mongoose.Schema({
    serviceSpares: { type: String, required: true },
    partNo: { type: String, required: true },
    rate: { type: String, required: true },
    quantity: { type: String, required: true },
    poNo: { type: String, required: true }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
    serviceId: { 
        type: String, 
        unique: true,
        default: () => `SERV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        index: true
    },
    nameAndLocation: { type: String, required: true },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    serviceEngineer: { type: String, required: true },
    date: { type: Date, required: true },
    place: { type: String, required: true },
    placeOptions: { type: String, required: true },
    natureOfJob: { type: String, required: true },
    reportNo: { type: String, required: true },
    makeModelNumberoftheInstrumentQuantity: { type: String, required: true },
    serialNumberoftheInstrumentCalibratedOK: { type: String, required: true },
    serialNumberoftheFaultyNonWorkingInstruments: { type: String, required: true },
    engineerRemarks: { type: [engineerRemarksSchema], required: true }, // Now storing multiple observations
    engineerName: { type: String, required: true }
}, {
    timestamps: true
});

// module.exports = mongoose.model("Services", serviceSchema);

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;


