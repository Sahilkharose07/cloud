const express = require("express");
const { CertificateController } = require("../../../controller");
// const { 
//     createCertificate, 
//     getCertificate, 
//     updateCertificate,
//     deleteCertificate,
//     getCertificatById,
//     downloadCertificate
// } = require("../../../controller");

const router = express.Router();

router.post(
    "/generateCertificate", 
    CertificateController.createCertificate
);

router.get(
    "/getCertificate", 
    CertificateController.getCertificate
);

router.get(
    "/getCertificateByid/:id", 
    CertificateController.getCertificatById
);

router.get(
    "/download/:certificateId", 
    CertificateController.downloadCertificate
);

router.put(
    "/updateCertificate/:id", 
    CertificateController.updateCertificate
);

router.delete(
    "/deleteCertificate/:id", 
    CertificateController.deleteCertificate
);

module.exports = router;