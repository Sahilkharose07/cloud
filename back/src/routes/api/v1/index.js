const express = require("express");

const router = express.Router();

const certificateRoutes = require("./certificateRoutes");
const serviceRoutes = require("./serviceRoutes");
const userRoutes = require("./users.routs");
const adminRoutes = require("./admin.routs");
const addCategoryRoutes = require("./addcategory.routs");
const addEngineerRoutes = require("./addengineer.Router");

router.use("/certificates", certificateRoutes);
router.use("/services", serviceRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);
router.use("/addcategory", addCategoryRoutes);
router.use("/engineers", addEngineerRoutes);

module.exports = router;


