"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/admin/admincomponents/page";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import axios from "axios";

interface EngineerRemarks {
    serviceSpares: string;
    partNo: string;
    rate: string;
    quantity: string;
    poNo: string;
}

interface ServiceRequest {
    customerName: string;
    customerLocation: string;
    contactPerson: string;
    contactNumber: string;
    serviceEngineer: string;
    date: string;
    place: string;
    placeOptions: string;
    natureOfJob: string;
    reportNo: string;
    makeModelNumberoftheInstrumentQuantity: string;
    serialNumberoftheInstrumentCalibratedOK: string;
    serialNumberoftheFaultyNonWorkingInstruments: string;
    engineerRemarks: EngineerRemarks[];
    engineerName: string;
    status: string;
}

interface ServiceResponse {
    serviceId: string;
    message: string;
    downloadUrl: string;
}

export default function GenerateService() {
    const [formData, setFormData] = useState<ServiceRequest>({
        customerName: "",
        customerLocation: "",
        contactPerson: "",
        contactNumber: "",
        serviceEngineer: "",
        date: new Date().toISOString().split('T')[0],
        place: "",
        placeOptions: "At Site", // Default value
        natureOfJob: "AMC",
        reportNo: "",
        makeModelNumberoftheInstrumentQuantity: "",
        serialNumberoftheInstrumentCalibratedOK: "",
        serialNumberoftheFaultyNonWorkingInstruments: "",
        engineerRemarks: [{ serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }],
        engineerName: "",
        status: ""
    });
    const [service, setService] = useState<ServiceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [engineers, setEngineers] = useState<{ name: string; id: string }[]>([]);
    const [selectedEngineer, setSelectedEngineer] = useState('');
    const [selectedServiceEngineer, setSelectedServiceEngineer] = useState("");


    const [serviceEngineerName, setServiceEngineerName] = useState("");
    const [engineerName, setEngineerName] = useState("");


    useEffect(() => {
        const fetchEngineers = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/v1/engineers/getEngineers");
                const data = await response.json();
                setEngineers(data);
            } catch (error) {
                console.error("Error fetching engineers:", error);
            }
        };
        fetchEngineers();
    }, []);

    const handleserviceEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setSelectedServiceEngineer(selectedId);

        const selectedEngineerObj = engineers.find(engineer => engineer.id === selectedId);
        const selectedName = selectedEngineerObj ? selectedEngineerObj.name : '';

        setServiceEngineerName(selectedName);

        setFormData(prev => ({
            ...prev,
            serviceEngineer: selectedName
        }));
    };

    const handleEngineerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        setSelectedEngineer(selectedId);

        const selectedEngineerObj = engineers.find(engineer => engineer.id === selectedId);
        const selectedName = selectedEngineerObj ? selectedEngineerObj.name : '';

        setEngineerName(selectedName);

        setFormData(prev => ({
            ...prev,
            engineerName: selectedName
        }));
    };




    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleengineerRemarksChange = (index: number, field: keyof EngineerRemarks, value: string) => {
        const updatedengineerRemarks = [...formData.engineerRemarks];
        updatedengineerRemarks[index] = { ...updatedengineerRemarks[index], [field]: value };
        setFormData({ ...formData, engineerRemarks: updatedengineerRemarks });
    };

    const addEngineerRemark = () => {
        if (formData.engineerRemarks.length < 10) {
            setFormData({
                ...formData,
                engineerRemarks: [...formData.engineerRemarks, { serviceSpares: "", partNo: "", rate: "", quantity: "", poNo: "" }]
            });
        }
    };

    const removeEngineerRemark = (index: number) => {
        const updatedEngineerRemarks = [...formData.engineerRemarks];
        updatedEngineerRemarks.splice(index, 1);
        setFormData({ ...formData, engineerRemarks: updatedEngineerRemarks });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/v1/services/generateService",
                formData
            );
            setService(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate service. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!service?.downloadUrl) return;

        try {
            const response = await axios.get(
                `http://localhost:5000${service.downloadUrl}`,
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `service-${service.serviceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError("Failed to download certificate. Please try again.");
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="addmodel">model</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="adminservice">
                                        <BreadcrumbPage>Admin Services</BreadcrumbPage>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="addcategory">
                                        <BreadcrumbPage>Admin Certificate</BreadcrumbPage>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="admincertificatetable">
                                        <BreadcrumbPage>Admin Certificate Table</BreadcrumbPage>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Admin Service</CardTitle>
                            <CardDescription className="text-center">
                                Please fill out the form below to generate a new Service.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="customerName"
                                        placeholder="Customer Name "
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        type="text"
                                        name="customerLocation"
                                        placeholder="Customer Location "
                                        value={formData.customerLocation}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <input
                                        type="text"
                                        name="contactPerson"
                                        placeholder="Contact Person"
                                        value={formData.contactPerson}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

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
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">


                                    <input
                                        type="text"
                                        name="contactNumber"
                                        placeholder="Contact Number"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <select value={selectedServiceEngineer} onChange={handleserviceEngineerChange}>
                                        <option value="">Select Service Engineer</option>
                                        {engineers.map(engineer => (
                                            <option key={engineer.id} value={engineer.id}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        data-date-format="DD-MM-YYYY"
                                        min="2000-01-01"
                                        max="2100-12-31"
                                    />

                                    <input
                                        type="text"
                                        name="place"
                                        placeholder="Enter Place"
                                        value={formData.place}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                                    <label className="font-medium text-gray-700">Place:</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeOptions"
                                                value="At Site"
                                                checked={formData.placeOptions === "At Site"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">At Site</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="placeOptions"
                                                value="In House"
                                                checked={formData.placeOptions === "In House"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">In House</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <label className="font-medium text-gray-700">Nature of Job:</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="AMC"
                                                checked={formData.natureOfJob === "AMC"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">AMC</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="Charged"
                                                checked={formData.natureOfJob === "Charged"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">Charged</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="natureOfJob"
                                                value="Warranty"
                                                checked={formData.natureOfJob === "Warranty"}
                                                onChange={handleChange}
                                                className="mr-2 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">Warranty</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        name="reportNo"
                                        placeholder="Report Number"
                                        value={formData.reportNo}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <select value={selectedEngineer} onChange={handleEngineerChange}>
                                        <option value="">Select Engineer</option>
                                        {engineers.map(engineer => (
                                            <option key={engineer.id} value={engineer.id}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        name="makeModelNumberoftheInstrumentQuantity"
                                        placeholder="Make & Model Number of the Instrument Quantity"
                                        value={formData.makeModelNumberoftheInstrumentQuantity}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <textarea
                                        name="serialNumberoftheInstrumentCalibratedOK"
                                        placeholder="Serial Number of the Instrument Calibrated & OK"
                                        value={formData.serialNumberoftheInstrumentCalibratedOK}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <textarea
                                        name="serialNumberoftheFaultyNonWorkingInstruments"
                                        placeholder="Serial Number of Faulty/Non-Working Instruments"
                                        value={formData.serialNumberoftheFaultyNonWorkingInstruments}
                                        onChange={handleChange}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <h2 className="text-lg font-bold mt-4">Engineer Remarks Table</h2>

                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={addEngineerRemark}
                                        className="bg-purple-950 text-white px-4 py-2 border rounded hover:bg-gray-900"
                                        disabled={formData.engineerRemarks.length >= 10}
                                    >
                                        Add Engineer Remark
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
                                            <th className="border p-2">Edit</th>
                                            <th className="border p-2">Save</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.engineerRemarks.map((engineerRemark, index) => (
                                            <tr key={index}>
                                                <td className="border p-2">{index + 1}</td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="serviceSpares"
                                                        value={engineerRemark.serviceSpares}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'serviceSpares', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="partNo"
                                                        value={engineerRemark.partNo}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'partNo', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="rate"
                                                        value={engineerRemark.rate}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'rate', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="quantity"
                                                        value={engineerRemark.quantity}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'quantity', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <input
                                                        type="text"
                                                        name="poNo"
                                                        value={engineerRemark.poNo}
                                                        onChange={(e) => handleengineerRemarksChange(index, 'poNo', e.target.value)}
                                                        className="w-full p-1 border rounded"
                                                    />
                                                </td>
                                                <td className="border p-2">
                                                    <button
                                                        onClick={() => removeEngineerRemark(index)}
                                                        className="bg-red-900 text-white px-2 py-1 border rounded hover:bg-red-950"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.engineerRemarks.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="border p-2 text-center text-gray-500">
                                                    No engineer remarks added yet. Click "Add Engineer Remark" to add one.
                                                </td>
                                            </tr>
                                        )}
                                        {formData.engineerRemarks.length >= 10 && (
                                            <tr>
                                                <td colSpan={5} className="border p-2 text-center text-yellow-600">
                                                    Maximum limit of 10 engineer remarks reached.
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
                                    {loading ? "Generating..." : "Generate Service"}
                                </button>
                            </form>
                            {service && (
                                <div className="mt-4 text-center">
                                    <p className="text-green-600 mb-2">{service.message}</p>
                                    <button
                                        onClick={handleDownload}
                                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                                    >
                                        Download Certificate
                                    </button>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter></CardFooter>
                    </Card>
                </div>
            </SidebarInset >
        </SidebarProvider >
    );
}
