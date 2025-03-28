const path = require("path");
const fs = require("fs");
const generatePDFService = require("../utils/serviceGenerator");
const Service = require("../model/serviceModel");

exports.createService = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const {
            nameAndLocation,
            contactPerson,
            contactNumber,
            serviceEngineer,
            date,
            place,
            placeOptions,
            natureOfJob,
            reportNo,
            makeModelNumberoftheInstrumentQuantity,
            serialNumberoftheInstrumentCalibratedOK,
            serialNumberoftheFaultyNonWorkingInstruments,
            engineerRemarks,
            engineerName,
        } = req.body;

        // Validate required fields
        if (!nameAndLocation?.trim() || 
            !contactPerson?.trim() || 
            !contactNumber?.trim() || 
            !serviceEngineer?.trim() || 
            !date || 
            !place?.trim() || 
            !placeOptions?.trim() || 
            !natureOfJob?.trim() || 
            !reportNo?.trim() || 
            !makeModelNumberoftheInstrumentQuantity?.trim() || 
            !serialNumberoftheInstrumentCalibratedOK?.trim() || 
            !serialNumberoftheFaultyNonWorkingInstruments?.trim() || 
            !engineerName?.trim()) {
            console.error("Missing or empty required fields");
            return res.status(400).json({ error: "All fields are required and cannot be empty" });
        }

        // Validate engineer remarks
        if (!Array.isArray(engineerRemarks) || engineerRemarks.length === 0) {
            console.error("Engineer remarks must be a non-empty array");
            return res.status(400).json({ error: "At least one engineer remark is required" });
        }

        // Validate each engineer remark
        const invalidRemarks = engineerRemarks.some(remark => {
            return !remark.serviceSpares?.trim() || 
                   !remark.partNo?.trim() || 
                   !remark.rate?.trim() || 
                   !remark.quantity?.trim() || isNaN(Number(remark.quantity)) ||
                   !remark.poNo?.trim();
        });

        if (invalidRemarks) {
            console.error("Invalid engineer remarks data");
            return res.status(400).json({ error: "All engineer remarks fields must be filled correctly. Quantity must be a number." });
        }

        const newService = new Service({
            nameAndLocation: nameAndLocation.trim(),
            contactPerson: contactPerson.trim(),
            contactNumber: contactNumber.trim(),
            serviceEngineer: serviceEngineer.trim(),
            date,
            place: place.trim(),
            placeOptions: placeOptions.trim(),
            natureOfJob: natureOfJob.trim(),
            reportNo: reportNo.trim(),
            makeModelNumberoftheInstrumentQuantity: makeModelNumberoftheInstrumentQuantity.trim(),
            serialNumberoftheInstrumentCalibratedOK: serialNumberoftheInstrumentCalibratedOK.trim(),
            serialNumberoftheFaultyNonWorkingInstruments: serialNumberoftheFaultyNonWorkingInstruments.trim(),
            engineerRemarks: engineerRemarks.map(remark => ({
                ...remark,
                serviceSpares: remark.serviceSpares.trim(),
                partNo: remark.partNo.trim(),
                rate: remark.rate.trim(),
                quantity: String(Number(remark.quantity)),
                poNo: remark.poNo.trim()
            })),
            engineerName: engineerName.trim()
        });

        console.log("Saving service to database...");
        await newService.save();
        console.log("Service saved successfully");

        console.log("Generating PDF...");
        const pdfPath = await generatePDFService(
            nameAndLocation.trim(),
            contactPerson.trim(),
            contactNumber.trim(),
            serviceEngineer.trim(),
            date,
            place.trim(),
            placeOptions.trim(),
            natureOfJob.trim(),
            reportNo.trim(),
            makeModelNumberoftheInstrumentQuantity.trim(),
            serialNumberoftheInstrumentCalibratedOK.trim(),
            serialNumberoftheFaultyNonWorkingInstruments.trim(),
            engineerRemarks.map(remark => ({
                ...remark,
                serviceSpares: remark.serviceSpares.trim(),
                partNo: remark.partNo.trim(),
                rate: remark.rate.trim(),
                quantity: String(Number(remark.quantity)),
                poNo: remark.poNo.trim()
            })),
            engineerName.trim(),
            newService.serviceId
        );
        console.log("PDF generated successfully at:", pdfPath);

        res.status(201).json({
            message: "Service generated successfully!",
            serviceId: newService.serviceId,
            downloadUrl: `/api/v1/services/download/${newService.serviceId}`
        });
    } catch (error) {
        console.error("Service generation error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Failed to generate service: " + error.message });
    }
};

exports.downloadService = async (req, res) => {
    try {
        console.log("Received request params:", req.params);
        const { serviceId } = req.params;

        // First check if the service exists in the database
        const service = await Service.findOne({ serviceId });
        if (!service) {
            console.error(`Service with ID ${serviceId} not found in database`);
            return res.status(404).json({ error: "Service not found" });
        }

        const pdfPath = path.join(process.cwd(), "services", `${serviceId}.pdf`);
        console.log("Looking for PDF at path:", pdfPath);

        if (!fs.existsSync(pdfPath)) {
            console.error(`Service file not found at path: ${pdfPath}`);
            return res.status(404).json({ error: "Service PDF file not found" });
        }

        console.log("Setting response headers...");
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=service-${serviceId}.pdf`);

        console.log("Creating read stream...");
        const stream = fs.createReadStream(pdfPath);
        
        stream.on('error', function (error) {
            console.error("Error streaming service:", error);
            res.status(500).json({ error: "Failed to download service: " + error.message });
        });

        stream.on('open', function() {
            console.log("Stream opened successfully, piping to response...");
            stream.pipe(res);
        });

        stream.on('end', function() {
            console.log("Stream ended successfully");
        });
    } catch (error) {
        console.error("Service download error:", error);
        res.status(500).json({ error: "Failed to download service: " + error.message });
    }
};
