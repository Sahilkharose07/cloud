const Company = require("../model/company.model"); 


const createCompany = async (req, res) => {
  try {
    const { companyName, address, gstNumber, industries, website, industriesType, flag } = req.body;

    const newCompany = new Company({
      companyName,
      address,
      gstNumber,
      industries,
      website,
      industriesType,
      flag,
    });

    const savedCompany = await newCompany.save();
    res.status(201).json({ message: "Company details added successfully", data: savedCompany });
  } catch (err) {
    res.status(500).json({ message: "Failed to create company", error: err.message });
  }
};

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch companies", error: err.message });
  }
};

// Get a single company by ID
const getCompanyById = async (req, res) => {
  const { id } = req.params;
  try {
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch company", error: err.message });
  }
};

// Update company details
const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { companyName, address, gstNumber, industries, website, industriesType, flag } = req.body;

  try {
    const updatedCompany = await Company.findByIdAndUpdate(id, {
      companyName,
      address,
      gstNumber,
      industries,
      website,
      industriesType,
      flag,
    }, { new: true });

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({ message: "Company updated successfully", data: updatedCompany });
  } catch (err) {
    res.status(500).json({ message: "Failed to update company", error: err.message });
  }
};

// Delete a company
const deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCompany = await Company.findByIdAndDelete(id);
    if (!deletedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete company", error: err.message });
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
}


