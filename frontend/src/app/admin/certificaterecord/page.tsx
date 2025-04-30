'use client';
import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { SearchIcon, Trash2, Download, ArrowUpIcon, ArrowDownIcon, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection } from "@heroui/react"
import { Pagination, Tooltip} from "@heroui/react"
import { AdminSidebar } from "@/components/admin-sidebar";
import { jsPDF } from "jspdf";

interface Observation {
    gas: string;
    before: string;
    after: string;
}

interface Certificate {
    _id: string;
    certificateNo: string;
    customerName: string;
    siteLocation: string;
    makeModel: string;
    range: string;
    serialNo: string;
    calibrationGas: string;
    gasCanisterDetails: string;
    dateOfCalibration: string;
    calibrationDueDate: string;
    observations: Observation[];
    engineerName: string;
    status?: string;
    createdAt?: string;
    key?: string;
}

type SortDescriptor = {
    column: string;
    direction: 'ascending' | 'descending';
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};

const columns = [
    { name: "Certificate Number", uid: "certificateNo", sortable: true, width: "120px" },
    { name: "Customer Name", uid: "customerName", sortable: true, width: "120px" },
    { name: "Site Location", uid: "siteLocation", sortable: true, width: "120px" },
    { name: "Model", uid: "makeModel", sortable: true, width: "120px" },
    { name: "Serial Number", uid: "serialNo", sortable: true, width: "120px" },
    { name: "Engineer Name", uid: "engineerName", sortable: true, width: "120px" },
    { name: "Date of Calibration", uid: "dateOfCalibration", sortable: true, width: "120px" },
    { name: "Actions", uid: "actions", sortable: false, width: "100px" },
];

export default function CertificateTable() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);
    const router = useRouter();
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [filterValue, setFilterValue] = useState("");
    const hasSearchFilter = Boolean(filterValue);

    const fetchCertificates = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/v1/certificates/getCertificate",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            let certificatesData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                certificatesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                certificatesData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            certificatesData.sort((a: Certificate, b: Certificate) =>
                new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
            );

            const certificatesWithKeys = certificatesData.map((certificate: Certificate) => ({
                ...certificate,
                key: certificate._id || generateUniqueId()
            }));

            setCertificates(certificatesWithKeys);
        } catch (error) {
            console.error("Error fetching certificates:", error);
            toast({
                title: "Error",
                description: "Failed to fetch certificates.",
                variant: "destructive",
            });
        }
    }, []);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const handleDelete = async (certificateId: string) => {
        if (!window.confirm("Are you sure you want to delete this certificate?")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:5000/api/v1/certificates/deleteCertificate/${certificateId}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                }
            });
            setCertificates((prevCertificates) => prevCertificates.filter(cert => cert._id !== certificateId));
            toast({
                title: "Success",
                description: "Certificate deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting certificate:", error);
            toast({
                title: "Error",
                description: "Failed to delete certificate.",
                variant: "destructive",
            });
        }
    };

    const headerColumns = React.useMemo(() => {
        return columns;
    }, []);

    const filteredItems = React.useMemo(() => {
        let filteredCertificates = [...certificates];

        if (hasSearchFilter) {
            filteredCertificates = filteredCertificates.filter((certificate) =>
                certificate.certificateNo.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.customerName.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.siteLocation.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.makeModel.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.serialNo.toLowerCase().includes(filterValue.toLowerCase()) ||
                certificate.engineerName.toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        if (startDate || endDate) {
            filteredCertificates = filteredCertificates.filter((certificate) => {
                const calibrationDate = new Date(certificate.dateOfCalibration);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;

                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);
                calibrationDate.setHours(0, 0, 0, 0);

                if (start && end) {
                    return calibrationDate >= start && calibrationDate <= end;
                } else if (start) {
                    return calibrationDate >= start;
                } else if (end) {
                    return calibrationDate <= end;
                }
                return true;
            });
        }

        return filteredCertificates;
    }, [certificates, hasSearchFilter, filterValue, startDate, endDate]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortDescriptor.column === 'dateOfCalibration' ||
                sortDescriptor.column === 'calibrationDueDate' ||
                sortDescriptor.column === 'createdAt') {
                const dateA = new Date(a[sortDescriptor.column] || "").getTime();
                const dateB = new Date(b[sortDescriptor.column] || "").getTime();
                const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                return sortDescriptor.direction === "descending" ? -cmp : cmp;
            }

            const first = a[sortDescriptor.column as keyof Certificate] || '';
            const second = b[sortDescriptor.column as keyof Certificate] || '';
            const cmp = String(first).localeCompare(String(second));

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const handleDownload = useCallback((certificateId: string) => {
        const certificateToDownload = certificates.find(cert => cert._id === certificateId);
        if (!certificateToDownload) {
            console.error("Certificate data not found");
            return;
        }

        const logo = new Image();
        logo.src = "/img/rps.png";

        logo.onload = () => {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const leftMargin = 15;
            const rightMargin = 15;
            const bottomMargin = 20;
            const contentWidth = pageWidth - leftMargin - rightMargin;

            const logoWidth = 60;
            const logoHeight = 20;
            const logoX = 2;
            const logoY = 10;
            doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

            let y = logoY + logoHeight + 10;

            doc.setFont("times", "bold").setFontSize(16).setTextColor(0, 51, 102);
            doc.text("CALIBRATION CERTIFICATE", pageWidth / 2, y, { align: "center" });

            y += 10;

            const labelX = leftMargin;
            const labelWidth = 55;
            const valueX = labelX + labelWidth + 2;
            const lineGap = 8;

            const formatDateForPDF = (dateString: string | null | undefined): string => {
                if (!dateString) return "N/A";
                try {
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString();
                } catch {
                    return "Invalid Date";
                }
            };

            const addRow = (labelText: string, value: string) => {
                doc.setFont("times", "bold").setFontSize(11).setTextColor(0);
                doc.text(labelText, labelX, y);
                doc.setFont("times", "normal").setTextColor(50);
                doc.text(": " + (value || "N/A"), valueX, y);
                y += lineGap;
            };

            addRow("Certificate No.", certificateToDownload.certificateNo);
            addRow("Customer Name", certificateToDownload.customerName);
            addRow("Site Location", certificateToDownload.siteLocation);
            addRow("Make & Model", certificateToDownload.makeModel);
            addRow("Range", certificateToDownload.range);
            addRow("Serial No.", certificateToDownload.serialNo);
            addRow("Calibration Gas", certificateToDownload.calibrationGas);
            addRow("Gas Canister Details", certificateToDownload.gasCanisterDetails);

            y += 5;
            addRow("Date of Calibration", formatDateForPDF(certificateToDownload.dateOfCalibration));
            addRow("Calibration Due Date", formatDateForPDF(certificateToDownload.calibrationDueDate));
            addRow("Status", certificateToDownload.status || "N/A");

            y += 5;
            doc.setDrawColor(180);
            doc.setLineWidth(0.3);
            doc.line(leftMargin, y, pageWidth - rightMargin, y);
            y += 10;

            doc.setFont("times", "bold").setFontSize(12).setTextColor(0, 51, 102);
            doc.text("OBSERVATIONS", leftMargin, y);
            y += 10;

            const colWidths = [20, 70, 40, 40];
            const headers = ["Sr. No.", "Concentration of Gas", "Reading Before", "Reading After"];
            let x = leftMargin;

            doc.setFont("times", "bold").setFontSize(10).setTextColor(0);
            headers.forEach((header, i) => {
                doc.rect(x, y - 5, colWidths[i], 8);
                doc.text(header, x + 2, y);
                x += colWidths[i];
            });
            y += 8;

            doc.setFont("times", "normal").setFontSize(10);
            certificateToDownload.observations.forEach((obs, index) => {
                let x = leftMargin;
                const rowY = y + index * 8;

                const rowData = [
                    `${index + 1}`,
                    obs.gas || "",
                    obs.before || "",
                    obs.after || ""
                ];

                rowData.forEach((text, colIndex) => {
                    doc.rect(x, rowY - 6, colWidths[colIndex], 8);
                    doc.text(text, x + 2, rowY);
                    x += colWidths[colIndex];
                });
            });

            y += certificateToDownload.observations.length * 8 + 15;

            const conclusion = "The above-mentioned Gas Detector was calibrated successfully, and the result confirms that the performance of the instrument is within acceptable limits.";
            doc.setFont("times", "normal").setFontSize(10).setTextColor(0);
            const conclusionLines = doc.splitTextToSize(conclusion, contentWidth);
            doc.text(conclusionLines, leftMargin, y);
            y += conclusionLines.length * 6 + 15;

            doc.setFont("times", "bold");
            doc.text("Tested & Calibrated By", pageWidth - rightMargin, y, { align: "right" });
            doc.setFont("times", "normal");
            doc.text(certificateToDownload.engineerName || "________________", pageWidth - rightMargin, y + 10, { align: "right" });

            doc.setDrawColor(180);
            doc.line(leftMargin, pageHeight - bottomMargin - 10, pageWidth - rightMargin, pageHeight - bottomMargin - 10);

            doc.setFontSize(8).setTextColor(100);
            doc.text("This certificate is electronically generated and does not require a physical signature.", leftMargin, pageHeight - bottomMargin - 5);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, leftMargin, pageHeight - bottomMargin);

            doc.save(`calibration-certificate-${certificateToDownload.certificateNo}.pdf`);
        };

        logo.onerror = () => {
            console.error("Logo image not found. Please check the path.");
        };
    }, [certificates]);

    const onNextPage = useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const handleSelectionChange = useCallback((keys: Selection) => {
        if (keys === "all") {
            setSelectedKeys(new Set(certificates.map(cert => cert._id)));
        } else {
            setSelectedKeys(keys as Set<string>);
        }
    }, [certificates]);

    const renderCell = useCallback((certificate: Certificate, columnKey: string): React.ReactNode => {
        const cellValue = certificate[columnKey as keyof Certificate];

        if ((columnKey === "dateOfCalibration" || columnKey === "calibrationDueDate") && cellValue) {
            return formatDate(cellValue as string);
        }

        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip content="Download">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDownload(certificate._id)}
                        >
                            <Download className="h-6 w-6" />
                        </span>
                    </Tooltip>

                    <Tooltip content="Edit">
                        <span
                            className="text-lg text-info cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                router.push(`certificateform?id=${certificate._id}`);
                            }}
                        >
                            <Edit className="h-6 w-6" />
                        </span>
                    </Tooltip>

                    <Tooltip content="Delete">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete(certificate._id);
                            }}
                        >
                            <Trash2 className="h-6 w-6" />
                        </span>
                    </Tooltip>
                </div>
            );
        }

        return cellValue as React.ReactNode;
    }, [handleDownload, router]);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <Input
                        isClearable
                        className="w-full max-w-[300px]"
                        placeholder="Search"
                        startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onClear={() => setFilterValue("")}
                    />
                    <label className="flex items-center text-default-400 text-small">
                        Rows per page:
                        <select
                            className="bg-transparent dark:bg-gray-800 outline-none text-default-400 text-small ml-2"
                            onChange={onRowsPerPageChange}
                            defaultValue="15"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                        </select>
                    </label>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-default-400">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-default-400">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                        />
                    </div>
                    {(startDate || endDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }}
                        >
                            Clear Dates
                        </Button>
                    )}
                </div>
            </div>
        );
    }, [filterValue, startDate, endDate, onRowsPerPageChange]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 relative flex justify-between items-center">
                <span className="text-default-400 text-small">
                    Total {certificates.length} certificates
                </span>
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <Pagination
                        isCompact
                        showShadow
                        color="success"
                        page={page}
                        total={pages}
                        onChange={setPage}
                        classNames={{
                            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
                            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
                        }}
                    />
                </div>

                <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={page === 1}
                        onClick={onPreviousPage}
                    >
                        Previous
                    </Button>
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={page === pages}
                        onClick={onNextPage}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [page, pages, certificates.length, onPreviousPage, onNextPage]);

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/admin/certificateform">
                                        Create Certificate
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-7xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Certificate Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table
                                isHeaderSticky
                                aria-label="Leads table with custom cells, pagination and sorting"
                                bottomContent={bottomContent}
                                bottomContentPlacement="outside"
                                classNames={{
                                    wrapper: "max-h-[382px] overflow-y-auto",
                                }}
                                selectedKeys={selectedKeys}
                                sortDescriptor={sortDescriptor}
                                topContent={topContent}
                                topContentPlacement="outside"
                                onSelectionChange={handleSelectionChange}
                                onSortChange={(descriptor) => {
                                    setSortDescriptor({
                                        column: descriptor.column as string,
                                        direction: descriptor.direction as "ascending" | "descending",
                                    });
                                }}
                            >
                                <TableHeader columns={headerColumns}>
                                    {(column) => (
                                        <TableColumn
                                            key={column.uid}
                                            align={column.uid === "actions" ? "center" : "start"}
                                            allowsSorting={column.sortable}
                                            onClick={() => {
                                                if (column.sortable) {
                                                    setSortDescriptor(prev => ({
                                                        column: column.uid,
                                                        direction: prev.column === column.uid && prev.direction === 'ascending'
                                                            ? 'descending'
                                                            : 'ascending'
                                                    }));
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                {column.name}
                                                {sortDescriptor.column === column.uid && (
                                                    <span className="ml-1">
                                                        {sortDescriptor.direction === 'ascending' ? (
                                                            <ArrowUpIcon className="h-4 w-4" />
                                                        ) : (
                                                            <ArrowDownIcon className="h-4 w-4" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody emptyContent={"Create certificate and add data"} items={sortedItems}>
                                    {(item) => (
                                        <TableRow key={item._id}>
                                            {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item, columnKey as string)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}