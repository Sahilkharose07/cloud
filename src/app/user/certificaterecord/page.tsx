'use client';
import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { SearchIcon, Trash2, Download, ArrowUpIcon, ArrowDownIcon, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection } from "@heroui/react"
import { Pagination, Tooltip, User } from "@heroui/react"
import { jsPDF } from "jspdf";
import { AppSidebar } from "@/components/app-sidebar";

interface Observation {
    gas: string;
    before: string;
    after: string;
}

interface Certificate {
    id: string;
    certificate_no: string;
    customer_name: string;
    site_location: string;
    make_model: string;
    range: string;
    serial_no: string;
    calibration_gas: string;
    gas_canister_details: string;
    date_of_calibration: string;
    calibration_due_date: string;
    observations: Observation[];
    engineer_name: string;
    status: string;
    createdAt: string;
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
    { name: "Certificate Number", uid: "certificate_no", sortable: true, width: "120px" },
    { name: "Customer Name", uid: "customer_name", sortable: true, width: "120px" },
    { name: "Site Location", uid: "site_location", sortable: true, width: "120px" },
    { name: "Model", uid: "make_model", sortable: true, width: "120px" },
    { name: "Serial Number", uid: "serial_no", sortable: true, width: "120px" },
    { name: "Engineer Name", uid: "engineer_name", sortable: true, width: "120px" },
    { name: "Download", uid: "actions", sortable: true, width: "100px" },
];

const INITIAL_VISIBLE_COLUMNS = ["certificate_no", "customer_name", "site_location", "make_model", "serial_no", "engineer_name", "actions"];

export default function CertificateTable() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({ 
        column: "createdAt", 
        direction: "descending" 
    });
    const router = useRouter();
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const API_BASE_URL = "/api/certificates";

    const fetchCertificates = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}?sort=-createdAt`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch certificates");
            }
            const data = await response.json();
            const certificatesData = Array.isArray(data) ? data : [];
            const certificatesWithKeys = certificatesData.map((certificate: Certificate) => ({
                ...certificate,
                key: certificate.id || generateUniqueId(),
                _id: certificate.id,
            }));
            
            // Ensure newest first even if backend didn't sort properly
            const sortedCertificates = [...certificatesWithKeys].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
            
            setCertificates(sortedCertificates);
            setError(null);
        } catch (error) {
            console.error("Error fetching certificates", error);
            setError("Failed to fetch certificates");
            setCertificates([]);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const [filterValue, setFilterValue] = useState("");
    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;
        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredCertificates = [...certificates];
        
        if (hasSearchFilter) {
            const searchLower = filterValue.toLowerCase();
            filteredCertificates = filteredCertificates.filter((certificate) =>
                (certificate.certificate_no?.toLowerCase() ?? "").includes(searchLower) ||
                (certificate.customer_name?.toLowerCase() ?? "").includes(searchLower) ||
                (certificate.site_location?.toLowerCase() ?? "").includes(searchLower) ||
                (certificate.make_model?.toLowerCase() ?? "").includes(searchLower) ||
                (certificate.serial_no?.toLowerCase() ?? "").includes(searchLower) ||
                (certificate.engineer_name?.toLowerCase() ?? "").includes(searchLower)
            );
        }

        if (startDate || endDate) {
            filteredCertificates = filteredCertificates.filter((certificate) => {
                const dateStr = certificate.date_of_calibration || certificate.createdAt;
                if (!dateStr) return false;
                const calibrationDate = new Date(dateStr);
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

    const items = filteredItems;

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            if (
                sortDescriptor.column === 'date_of_calibration' ||
                sortDescriptor.column === 'calibration_due_date' ||
                sortDescriptor.column === 'createdAt'
            ) {
                const dateA = new Date(a[sortDescriptor.column as keyof Certificate] as string).getTime();
                const dateB = new Date(b[sortDescriptor.column as keyof Certificate] as string).getTime();
                const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
                return sortDescriptor.direction === "descending" ? -cmp : cmp;
            }

            const first = a[sortDescriptor.column as keyof Certificate] || '';
            const second = b[sortDescriptor.column as keyof Certificate] || '';
            const cmp = String(first).localeCompare(String(second));

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

  
    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-center w-full gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Input
                            isClearable 
                            className="w-full max-w-[300px]"
                            placeholder="Search"
                            startContent={<SearchIcon className="h-4 w-5 text-muted-foreground" />}
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onClear={() => setFilterValue("")}
                        />
                    </div>
                    <div className="flex items-center gap-3 mx-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-default-400">From:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded p-2 text-sm bg-white text-black 
                                dark:bg-white dark:border-gray-700 dark:text-black"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-default-400">To:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="border border-gray-300 rounded p-2 text-sm bg-white text-black 
                                dark:bg-white dark:border-gray-700 dark:text-black"
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
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                        Total: <strong>{filteredItems.length}</strong> certificate{filteredItems.length !== 1 ? "s" : ""}
                    </div>
                </div>
            </div>
        );
    }, [filterValue, startDate, endDate, filteredItems.length]);

    const bottomContent = (
        <div className="py-2 px-2">
            <span className="text-default-400 text-small">
                Total {filteredItems.length} certificates
            </span>
        </div>
    );

    const handleSelectionChange = (keys: Selection) => {
        if (keys === "all") {
            setSelectedKeys(new Set(certificates.map(cert => cert.id)));
        } else {
            setSelectedKeys(keys as Set<string>);
        }
    };

    const handleVisibleColumnsChange = (keys: Selection) => {
        setVisibleColumns(keys);
    };

    const renderCell = React.useCallback(
        (certificate: Certificate, columnKey: string): React.ReactNode => {
            if (columnKey === "actions") {
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip>
                            <span
                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                // onClick={() => handleDownload(certificate.id)}
                            >
                                <Download className="h-6 w-6" />
                            </span>
                        </Tooltip>
                    </div>
                );
            }

            const cellValue = certificate[columnKey as keyof Certificate];

            if ((columnKey === "date_of_calibration" || columnKey === "calibration_due_date" || columnKey === "createdAt") && cellValue) {
                return formatDate(cellValue as string);
            }

            if (columnKey === "observations" && Array.isArray(cellValue)) {
                return (cellValue as Observation[]).map((obs, index) => (
                    <div key={index}>
                        <span>{obs.gas || '-'}</span> - <span>{obs.before || '-'}</span> - <span>{obs.after || '-'}</span>
                    </div>
                ));
            }

            return (cellValue as string) || "N/A";
        },
        []
    );

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
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/user/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/user/certificateform">
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
                                aria-label="Certificates table with custom cells, pagination and sorting"
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
                                <TableBody emptyContent={"No certificates found"} items={[...sortedItems].reverse()}>

                                    {(item) => (
                                        <TableRow key={item.id}>
                                            {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCell(item as Certificate, columnKey as string)}</TableCell>}
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