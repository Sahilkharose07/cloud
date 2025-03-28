const path = require("path");
const fs = require("fs");
const generatePDFService = require("../utils/serviceGenerator");
const Service = require("../model/serviceModel");

exports.getServices = async (req, res) => {
    try {
        const services = await Service.find();
        res.status(200).json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({ error: "Failed to fetch services" });
    }
};

exports.createService = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const {
            customerName,
            customerLocation,
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
            status
        } = req.body;

        // Validate required fields
        if (!customerName?.trim() ||
            !customerLocation?.trim() ||
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
            !engineerName?.trim() ||
            !status?.trim()
        ) {
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
            customerName: customerName.trim(),
            customerLocation:customerLocation.trim(),
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
            engineerName: engineerName.trim(),
            status: status.trim()
        });

        console.log("Saving service to database...");
        await newService.save();
        console.log("Service saved successfully");

        console.log("Generating PDF...");
        const pdfPath = await generatePDFService(
            customerName.trim(),
            customerLocation.trim(),
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
            status.trim(),
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

        let service;
        // Check if the ID matches MongoDB ObjectId pattern (24 hex characters)
        if (/^[0-9a-fA-F]{24}$/.test(serviceId)) {
            // Try to find service by MongoDB _id first
            service = await Service.findById(serviceId);
        }

        // If not found by _id or if serviceId wasn't a MongoDB ID, try finding by serviceId field
        if (!service) {
            service = await Service.findOne({ serviceId: serviceId });
        }

        if (!service) {
            console.error(`Service not found in database: ${serviceId}`);
            return res.status(404).json({ error: "Service not found in database" });
        }

        // Use the service's custom serviceId for the PDF filename
        const pdfPath = path.join(process.cwd(), "services", `${service.serviceId}.pdf`);
        console.log("Looking for PDF at path:", pdfPath);

        if (!fs.existsSync(pdfPath)) {
            console.error(`Service file not found at path: ${pdfPath}`);

            // Try to regenerate the PDF
            console.log("Attempting to regenerate PDF...");
            try {
                await generatePDFService(
                    service.customerName,
                    service.customerLocation,
                    service.contactPerson,
                    service.contactNumber,
                    service.serviceEngineer,
                    service.date,
                    service.place,
                    service.placeOptions,
                    service.natureOfJob,
                    service.reportNo,
                    service.makeModelNumberoftheInstrumentQuantity,
                    service.serialNumberoftheInstrumentCalibratedOK,
                    service.serialNumberoftheFaultyNonWorkingInstruments,
                    service.engineerRemarks,
                    service.engineerName,
                    service.status,
                    service.serviceId
                );
                console.log("PDF regenerated successfully");
            } catch (regenerateError) {
                console.error("Failed to regenerate PDF:", regenerateError);
                return res.status(500).json({ error: "Failed to regenerate service PDF" });
            }

            // Check again if the file exists after regeneration
            if (!fs.existsSync(pdfPath)) {
                return res.status(404).json({ error: "Service file could not be generated" });
            }
        }

        console.log("Setting response headers...");
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=service-${service.serviceId}.pdf`);

        console.log("Creating read stream...");
        const stream = fs.createReadStream(pdfPath);
        stream.on('error', function (error) {
            console.error("Error streaming service:", error);
            console.error("Error stack:", error.stack);
            res.status(500).json({ error: "Failed to download service: " + error.message });
        });

        console.log("Piping stream to response...");
        stream.pipe(res);
    } catch (error) {
        console.error("Service download error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Failed to download service: " + error.message });
    }
};