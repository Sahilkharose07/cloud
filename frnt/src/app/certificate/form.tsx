"use client";

import { useState } from "react";
import axios from "axios";

interface Observation {
  gas: string;
  before: string;
  after: string;
}

interface CertificateRequest {
  certificateNo: String,
  customerName: String,
  siteLocation: String,
  makeModel: String,
  range: String,
  serialNo: String,
  calibrationGas: String,
  gasCanisterDetails: String,
  dateOfCalibration: Date,
  calibrationDueDate: Date,
  observations: Observation[],
  engineerName: String,
  status: string
}

interface CertificateResponse {
  certificateId: string;
  message: string;
  downloadUrl: string;
}

const makeModelRanges: { [key: string]: string } = {
  "GMIleakSurveyor": "0-1000ppm,0-100%LEL,0-100%vol",
  "GMIGT41Series": "0-1000ppm,0-100%LEL,0-100%vol,0-25%vol",
  "GMIGT44": "0-1000ppm,0-100%LEL,0-100%vol",
  "GMIPS200": "0-100%LEL,0-100ppmH2S,0-1000ppmCO,0-25%v0l",
  "GMIPS221": "0-100%LEL,0-25%vol",
  "GS700": "0-100ppm,0-100%LEL,0-100%vol,0-25%vol,0-300ppm CO",
  "HydrocarbonGasDetector": "0-100%LEL",
  "OldhamVOC": "0-500ppm",
  "OldhamitransCO": "0-300ppm",
  "OldhamCl2GastronOtherMake": "0-20ppm",
  "OldhamGastronOtherMakeAmmonia": "0-1000ppm",
  "BlacklineSafetyG7c": "0-100%LEL,0-25%vol,0-100ppm VOC ",
  "Uniphos235237EthyleMercaptanTBMmonitor": "0-20PPM,0-40ppm,0-200ppm",
  "Uniphos299ppm": "0-10000ppm"
};

export default function GenerateCertificate() {
  const [formData, setFormData] = useState<CertificateRequest>({
    customerName: "",
    siteLocation: "",
    makeModel: "",
    range: "",
    serialNo: "",
    calibrationGas: "",
    gasCanisterDetails: "",
    dateOfCalibration: new Date().toISOString().split('T')[0],
    calibrationDueDate: new Date().toISOString().split('T')[0],
    observations: [{ gas: "", before: "", after: "" }],
    engineerName: "",
    status: ""
  });
  const [certificate, setCertificate] = useState<CertificateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<number | null>(null);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    setFormData(prev => ({
      ...prev,
      dateOfCalibration: new Date(newStartDate)
    }));

    if (timePeriod) {
      const startDateObj = new Date(newStartDate);
      startDateObj.setMonth(startDateObj.getMonth() + timePeriod);
      const newEndDate = startDateObj.toISOString().split("T")[0];
      setEndDate(newEndDate);
      setFormData(prev => ({
        ...prev,
        dateOfCalibration: new Date(newStartDate),
        calibrationDueDate: startDateObj
      }));
    }
  };

  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = Number(e.target.value);
    setTimePeriod(period);

    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setMonth(startDateObj.getMonth() + period);
      const newEndDate = startDateObj.toISOString().split("T")[0];
      setEndDate(newEndDate);
      setFormData(prev => ({
        ...prev,
        calibrationDueDate: startDateObj
      }));
    }
  };

  const updateEndDate = (start: string, months: number) => {
    const startDateObj = new Date(start);
    startDateObj.setMonth(startDateObj.getMonth() + months);
    const newEndDate = startDateObj.toISOString().split("T")[0];
    setEndDate(newEndDate);
    setFormData(prev => ({
      ...prev,
      calibrationDueDate: startDateObj
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    const updatedValue = e.target.type === "date"
      ? new Date(e.target.value).toISOString().split("T")[0]
      : value;

    let updatedObservations = formData.observations;
    let updatedRange = formData.range;

    if (name === "makeModel") {
      // Set the range based on the selected make/model
      updatedRange = makeModelRanges[value] || "";

      switch (value) {
        case "GMIleakSurveyor":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIGT41Series":
          updatedObservations = Array(4).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIGT44":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIPS200":
          updatedObservations = Array(4).fill({ gas: "", before: "", after: "" });
          break;
        case "GMIPS221":
          updatedObservations = Array(2).fill({ gas: "", before: "", after: "" });
          break;
        case "GS700":
          updatedObservations = Array(5).fill({ gas: "", before: "", after: "" });
          break;
        case "HydrocarbonGasDetector":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        case "OldhamVOC":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        case "OldhamitransCO":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        case "OldhamCl2GastronOtherMake":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        case "OldhamGastronOtherMakeAmmonia":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        case "BlacklineSafetyG7c":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        case "Uniphos235237EthyleMercaptanTBMmonitor":
          updatedObservations = Array(3).fill({ gas: "", before: "", after: "" });
          break;
        case "Uniphos299ppm":
          updatedObservations = Array(1).fill({ gas: "", before: "", after: "" });
          break;
        default:
          updatedObservations = [{ gas: "", before: "", after: "" }];
      }

      setFormData(prev => ({
        ...prev,
        makeModel: value,
        range: updatedRange,
        observations: updatedObservations
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: updatedValue
      }));
    }
  };

  const handleObservationChange = (index: number, field: keyof Observation, value: string) => {
    const updatedObservations = [...formData.observations];
    updatedObservations[index] = { ...updatedObservations[index], [field]: value };
    setFormData({ ...formData, observations: updatedObservations });
  };

  const addObservation = () => {
    if (formData.observations.length < 5) {
      setFormData({
        ...formData,
        observations: [...formData.observations, { gas: "", before: "", after: "" }]
      });
    }
  };

  const removeObservation = (index: number) => {
    const updatedObservations = [...formData.observations];
    updatedObservations.splice(index, 1);
    setFormData({ ...formData, observations: updatedObservations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Form data before submission:', formData);

    try {
      // Ensure dates are properly formatted
      const submissionData = {
        ...formData,
        dateOfCalibration: startDate ? new Date(startDate) : null,
        calibrationDueDate: endDate ? new Date(endDate) : null
      };

      console.log('Submitting data:', submissionData);

      const response = await axios.post(
        "http://localhost:5000/api/v1/certificates/generateCertificate",
        submissionData
      );
      setCertificate(response.data);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.error || "Failed to generate certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate?.downloadUrl) return;

    try {
      const response = await axios.get(
        `http://localhost:5000${certificate.downloadUrl}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificate.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download certificate. Please try again.");
    }
  };

  return (
    <div>
      {/* <h1 className="text-2xl font-bold mb-4">Generate Your Certificate</h1> */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="text"
            name="customerName"
            placeholder="Enter Name"
            value={formData.customerName}
            onChange={handleChange}
            className="p-2 border rounded"
          />
          <input
            type="text"
            name="siteLocation"
            placeholder="Enter Site Location"
            value={formData.siteLocation}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          <select
            name="makeModel"
            value={formData.makeModel}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Make and Model</option>
            <option value="GMIleakSurveyor">GMI leak Surveyor</option>
            <option value="GMIGT41Series">GMI GT 41 Series</option>
            <option value="GMIGT44">GMI GT 44</option>
            <option value="GMIPS200">GMI PS200</option>
            <option value="GMIPS221">GMI PS221</option>
            <option value="GS700">GS700</option>
            <option value="HydrocarbonGasDetector">Hydrocarbon gas detector</option>
            <option value="OldhamVOC">Oldham VOC</option>
            <option value="OldhamitransCO">Oldham itrans CO</option>
            <option value="OldhamCl2GastronOtherMake">Oldham Cl2/Gastron/Other Make</option>
            <option value="OldhamGastronOtherMakeAmmonia">Oldham/Gastron/Other make Ammonia</option>
            <option value="BlacklineSafetyG7c">Blackline safety G7c</option>
            <option value="Uniphos235237EthyleMercaptanTBMmonitor">Uniphos 235/237 Ethyle mercaptan/TBM monitor</option>
            <option value="Uniphos299ppm">Uniphos 299ppm</option>
          </select>

          <input
            type="text"
            name="range"
            placeholder="Range"
            value={formData.range}
            onChange={handleChange}
            className="p-2 border rounded"
            disabled
          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

          <input
            type="text"
            name="serialNo"
            placeholder="Enter Serial Number"
            value={formData.serialNo}
            onChange={handleChange}
            className="p-2 border rounded"

          />
          <input
            type="text"
            name="calibrationGas"
            placeholder="Enter Calibration Gas"
            value={formData.calibrationGas}
            onChange={handleChange}
            className="p-2 border rounded"

          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
          <textarea
            name="gasCanisterDetails"
            placeholder="Enter Gas Canister Details"
            value={formData.gasCanisterDetails}
            onChange={handleChange}
            className="p-2 border rounded"

          />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="date"
            name="dateOfCalibration"
            placeholder="Enter Date of Calibration"
            value={startDate}
            onChange={handleStartDateChange}
            className="p-2 border rounded"
            data-date-format="DD-MM-YYYY"
            min="2000-01-01"
            max="2100-12-31"
          />
          <select
            onChange={handleTimePeriodChange}
            className="border p-2 rounded-md"
          >
            <option value="">Select Period</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="9">9 Months</option>
            <option value="12">12 Months</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <input
            type="date"
            name="calibrationDueDate"
            placeholder="Enter Calibration Due Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFormData(prev => ({
                ...prev,
                calibrationDueDate: new Date(e.target.value)
              }));
            }}
            className="p-2 border rounded"
            disabled={timePeriod !== null}
            data-date-format="DD-MM-YYYY"
            min="2000-01-01"
            max="2100-12-31"
          />
          <select
            name="engineerName"
            value={formData.engineerName}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Engineer Name</option>
            <option value="MR. Pintu Rathod">MR. Pintu Rathod</option>
            <option value="MR. Vivek">MR. Vivek</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Status</option>
            <option value="Checked">Checked</option>
            <option value="Unchecked">Unchecked</option>
          </select>
        </div>

        <h2 className="text-lg font-bold mt-4">Observation Table</h2>
        <div className="flex justify-end mb-4">
          <button
            onClick={addObservation}
            className="bg-black-500 text-white px-4 py-2 border rounded hover:bg-gray-900"
            disabled={formData.observations.length >= 5}
          >
            Add Observation
          </button>
        </div>
        <table className="table-auto border-collapse border border-gray-500 rounded w-full">
          <thead>
            <tr>
              <th className="border p-2">#</th>
              <th className="border p-2">Gas</th>
              <th className="border p-2">Before Calibration</th>
              <th className="border p-2">After Calibration</th>
              <th className="border p-2">Remove</th>
            </tr>
          </thead>
          <tbody>
            {formData.observations.map((observation, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="gas"
                    value={observation.gas}
                    onChange={(e) => handleObservationChange(index, 'gas', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="before"
                    value={observation.before}
                    onChange={(e) => handleObservationChange(index, 'before', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    name="after"
                    value={observation.after}
                    onChange={(e) => handleObservationChange(index, 'after', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => removeObservation(index)}
                    className="bg-black-500 text-white px-2 py-1 border rounded hover:bg-red-950"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {formData.observations.length === 0 && (
              <tr>
                <td colSpan={5} className="border p-2 text-center text-gray-500">
                  No observations added yet. Click "Add Observation" to add one.
                </td>
              </tr>
            )}
            {formData.observations.length >= 5 && (
              <tr>
                <td colSpan={5} className="border p-2 text-center text-yellow-600">
                  Maximum limit of 5 observations reached.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          type="submit"
          className="bg-blue-950 hover:bg-blue-900 text-white p-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Certificate"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {certificate && (
        <div className="mt-4 text-center">
          <p className="text-green-600 mb-2">{certificate.message}</p>
          <button
            onClick={handleDownload}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Download Certificate
          </button>
        </div>
      )}
    </div>
  );
}
