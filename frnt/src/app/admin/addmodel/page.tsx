"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/admin/adminComponents/page";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Observation {
    gas: string;
    before: string;
    after: string;
}

interface CertificateRequest {
    makeModel: string;
    range: string;
    observations: Observation[];
}

interface Model {
    id: string;
    model_name: string;
    range: string;
}

export default function AddModel() {
    const [formData, setFormData] = useState<CertificateRequest>({
        makeModel: "",
        range: "",
        observations: [],
    });
    const [newModel, setNewModel] = useState<string>("");
    const [newRange, setNewRange] = useState<string>("");
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [engineers, setEngineers] = useState<{ name: string; id: string }[]>([]);
    const [newEngineer, setNewEngineer] = useState<string>("");
    const [selectedEngineer, setSelectedEngineer] = useState<string>("");


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/v1/addcategory/getCategories');
                const data = await response.json();
                setModels(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

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


    const handleAddEngineer = async () => {
        if (newEngineer) {
            setLoading(true);
            try {
                const response = await fetch("http://localhost:5000/api/v1/engineers/addEngineer", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: newEngineer }),
                });

                const result = await response.json();
                if (response.ok) {
                    setEngineers([...engineers, { name: newEngineer, id: result.id }]);
                    setNewEngineer("");
                    alert(result.message);
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error("Error adding engineer:", error);
                alert("Failed to add engineer.");
            } finally {
                setLoading(false);
            }
        } else {
            alert("Please enter an engineer name.");
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "makeModel") {
            const selectedModel = models.find(model => model.model_name === value);

            if (selectedModel) {
                setFormData(prev => ({
                    ...prev,
                    makeModel: value,
                    range: selectedModel.range,
                }));
            }
        } else {
            const updatedValue = e.target.type === "date"
                ? new Date(e.target.value).toISOString().split("T")[0]
                : value;

            setFormData(prev => ({
                ...prev,
                [name]: updatedValue,
            }));
        }
    };

    // Handle adding a new model and range
    const handleNewModelAndRange = async () => {
        if (newModel && newRange) {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/api/v1/addcategory/addnewCategory', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model_name: newModel,
                        range: newRange,
                    }),
                });

                const result = await response.json();
                if (response.ok) {
                    setModels([...models, { id: result.id, model_name: newModel, range: newRange }]);
                    setNewModel("");
                    setNewRange("");
                    alert(result.message);
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error("Error adding category:", error);
                alert("Failed to add new model and range.");
            } finally {
                setLoading(false);
            }
        } else {
            alert("Please fill both the model and range.");
        }
    };


    const handleDeleteModel = async (id: string) => {
        if (!id) {
            alert("Invalid category ID");
            return;
        }

        if (!/^[0-9a-fA-F]{24}$/.test(id)) {
            alert("Invalid ObjectId format");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this model?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/v1/addcategory/deleteCategory/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to delete category");
            }

            setModels(models.filter(model => model.id !== id));
            alert("Category deleted successfully");
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("Error deleting category. Please try again.");
        }
    };





    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Form submitted! (No backend interaction)");
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
                                    <BreadcrumbLink href="add-model">model</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="addcategory">
                                        <BreadcrumbPage>Admin Certificate</BreadcrumbPage>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="adminservice">
                                        <BreadcrumbPage>Admin Service</BreadcrumbPage>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Certificate</CardTitle>
                            <CardDescription className="text-center">
                                Please fill out the form below to generate a new User.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h2 className="text-lg font-bold mt-4">Add New Model and Range</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <select
                                        name="makeModel"
                                        value={formData.makeModel}
                                        onChange={handleChange}
                                        className="p-2 border rounded"
                                    >
                                        <option value="">Select Make and Model</option>
                                        {models.map((model) => (
                                            <option key={model.model_name} value={model.model_name}>
                                                {model.model_name}
                                            </option>
                                        ))}
                                    </select>

                                    {/* {formData.makeModel && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const selectedModel = models.find(m => m.model_name === formData.makeModel);
                                                if (selectedModel) {
                                                    handleDeleteModel(selectedModel.id);
                                                } else {
                                                    alert("Selected model not found!");
                                                }
                                            }}
                                            className="bg-red-500 text-white px-4 py-2 rounded ml-2 hover:bg-red-700"
                                        >
                                            Delete Selected Model
                                        </button>
                                    )} */}

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

                                {/* Add New Model and Range */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        placeholder="New Model"
                                        value={newModel}
                                        onChange={(e) => setNewModel(e.target.value)}
                                        className="p-2 border rounded"
                                    />
                                    <input
                                        type="text"
                                        placeholder="New Range"
                                        value={newRange}
                                        onChange={(e) => setNewRange(e.target.value)}
                                        className="p-2 border rounded"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNewModelAndRange}
                                    className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add New Model and Range'}
                                </button>

                                <h2 className="text-lg font-bold mt-4">Add New Engineer</h2>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <select
                                        name="selectedEngineer"
                                        value={selectedEngineer}
                                        onChange={(e) => setSelectedEngineer(e.target.value)}
                                        className="p-2 border rounded"
                                    >
                                        <option value="">Select Engineer</option>
                                        {engineers.map((engineer, index) => (
                                            <option key={engineer.id || index} value={engineer.id}>
                                                {engineer.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        placeholder="New Engineer Name"
                                        value={newEngineer}
                                        onChange={(e) => setNewEngineer(e.target.value)}
                                        className="p-2 border rounded"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddEngineer}
                                    className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                                    disabled={loading}
                                >
                                    {loading ? "Adding..." : "Add Engineer"}
                                </button>
                            </form>
                        </CardContent>
                        <CardFooter></CardFooter>
                    </Card>
                </div>
            </SidebarInset >
        </SidebarProvider >
    );
}
