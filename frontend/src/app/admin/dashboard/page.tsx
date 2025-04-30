'use client';

import { Breadcrumb, BreadcrumbPage, BreadcrumbList, BreadcrumbItem } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

import React, { useEffect, useState, useCallback } from "react"
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Selection } from "@heroui/react"
import { Pagination } from "@heroui/react"
import { AdminSidebar } from "@/components/admin-sidebar";

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
    engineerName: string;
    [key: string]: string;
}

interface Service {
    _id: string;
    nameAndLocation: string;
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
    engineerName: string;
    [key: string]: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    contact: number;
}

type SortDescriptor = {
    column: string;
    direction: 'ascending' | 'descending';
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const generateUniqueIdService = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const columns = [
    { name: "Certificate Number", uid: "certificateNo", sortable: true, width: "120px" },
    { name: "Customer", uid: "customerName", sortable: true, width: "120px" },
    { name: "Site Location", uid: "siteLocation", sortable: true, width: "120px" },
    { name: "Make Model", uid: "makeModel", sortable: true, width: "120px" },
    { name: "Serial Number", uid: "serialNo", sortable: true, width: "120px" },
    { name: "Engineer Name", uid: "engineerName", sortable: true, width: "120px" },
];

const columnsservice = [
    { name: "Contact Person", uid: "contactPerson", sortable: true, width: "120px" },
    { name: "Contact Number", uid: "contactNumber", sortable: true, width: "120px" },
    { name: "Service Engineer", uid: "serviceEngineer", sortable: true, width: "120px" },
    { name: "Report Number", uid: "reportNo", sortable: true, width: "120px" },
];

export default function Page() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set([]));
    const [selectedKeysService, setSelectedKeysService] = React.useState<Set<string>>(new Set([]));
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [rowsPerPageService, setRowsPerPageService] = useState(10);
    const [filterValue, setFilterValue] = useState("");
    const [filterValueservice, setFilterValueservice] = useState("");
    const [page, setPage] = React.useState(1);
    const [pageService, setPageService] = React.useState(1);
    
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "certificateNo",
        direction: "ascending",
    });

    const [sortDescriptorService, setSortDescriptorService] = React.useState<SortDescriptor>({
        column: "nameAndLocation",
        direction: "ascending",
    });

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

            const certificatesWithKeys = (certificatesData || []).map((certificate: Certificate) => ({
                ...certificate,
                key: certificate._id || generateUniqueId()
            }));

            setCertificates(certificatesWithKeys);
        } catch (error) {
            console.error("Error fetching certificates:", error);
            setCertificates([]);
        }
    }, []);

    const fetchServices = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/v1/services/getServices",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            let servicesData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                servicesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                servicesData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            const servicesWithKeys = (servicesData || []).map((service: Service) => ({
                ...service,
                key: service._id || generateUniqueIdService()
            }));

            setServices(servicesWithKeys);
        } catch (error) {
            console.error("Error fetching services:", error);
            setServices([]);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/v1/users/getusers",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            let usersData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                usersData = response.data.data;
            } else if (Array.isArray(response.data)) {
                usersData = response.data;
            } else {
                throw new Error('Invalid response format');
            }

            setUsers(usersData || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        }
    }, []);

    useEffect(() => {
        fetchCertificates();
        fetchServices();
        fetchUsers();
    }, [fetchCertificates, fetchServices, fetchUsers]);

    const hasSearchFilter = Boolean(filterValue);
    const hasSearchFilterservice = Boolean(filterValueservice);

    const headerColumns = React.useMemo(() => {
        return columns.filter((column) => column.uid !== "actions");
    }, []);

    const headerColumnsservice = React.useMemo(() => {
        return columnsservice.filter((column) => column.uid !== "actions");
    }, []);

    const filteredItems = React.useMemo(() => {
        let filteredCertificates = [...certificates];

        if (hasSearchFilter) {
            filteredCertificates = filteredCertificates.filter((certificate) =>
                Object.values(certificate).some(
                    (value) => 
                        typeof value === 'string' && 
                        value.toLowerCase().includes(filterValue.toLowerCase())
                )
            );
        }

        return filteredCertificates;
    }, [certificates, filterValue, hasSearchFilter]);

    const filteredItemsservice = React.useMemo(() => {
        let filteredServices = [...services];

        if (hasSearchFilterservice) {
            filteredServices = filteredServices.filter((service) =>
                Object.values(service).some(
                    (value) => 
                        typeof value === 'string' && 
                        value.toLowerCase().includes(filterValueservice.toLowerCase())
                )
            );
        }

        return filteredServices;
    }, [services, filterValueservice, hasSearchFilterservice]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);
    const pageservices = Math.ceil(filteredItemsservice.length / rowsPerPageService);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const itemsservice = React.useMemo(() => {
        const start = (pageService - 1) * rowsPerPageService;
        const end = start + rowsPerPageService;
        return filteredItemsservice.slice(start, end);
    }, [pageService, filteredItemsservice, rowsPerPageService]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Certificate];
            const second = b[sortDescriptor.column as keyof Certificate];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const sortedItemsservice = React.useMemo(() => {
        return [...itemsservice].sort((a, b) => {
            const first = a[sortDescriptorService.column as keyof Service];
            const second = b[sortDescriptorService.column as keyof Service];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptorService.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptorService, itemsservice]);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onNextPageservice = React.useCallback(() => {
        if (pageService < pageservices) {
            setPageService(pageService + 1);
        }
    }, [pageService, pageservices]);

    const onPreviousPageService = React.useCallback(() => {
        if (pageService > 1) {
            setPageService(pageService - 1);
        }
    }, [pageService]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
}, []);

const onRowsPerPageChangeservice = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPageService(Number(e.target.value));
    setPageService(1);
}, []);

const onSearchChange = React.useCallback((value: string) => {
    setFilterValue(value);
    setPage(1);
}, []);

const onSearchChangeservice = React.useCallback((value: string) => {
    setFilterValueservice(value);
    setPageService(1);
}, []);


   const topContent = React.useMemo(() => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-end">
                <div className="relative w-full sm:max-w-[20%]">
                    <Input
                        isClearable
                        className="w-full pr-12 sm:pr-14 pl-12"
                        startContent={<SearchIcon className="h-4 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />}
                        placeholder="Search"
                        value={filterValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onClear={() => onSearchChange("")}
                    />
                </div>
                <select value={rowsPerPage} onChange={onRowsPerPageChange} className="border rounded px-2 py-1">
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                </select>
            </div>
        </div>
    );
}, [filterValue, onSearchChange, onRowsPerPageChange, rowsPerPage]);

const topContentservice = React.useMemo(() => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-end">
                <div className="relative w-full sm:max-w-[20%]">
                    <Input
                        isClearable
                        className="w-full pr-12 sm:pr-14 pl-12"
                        placeholder="Search"
                        startContent={<SearchIcon className="h-4 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />}
                        value={filterValueservice}
                        onChange={(e) => onSearchChangeservice(e.target.value)}
                        onClear={() => onSearchChangeservice("")}
                    />
                </div>
                <select value={rowsPerPageService} onChange={onRowsPerPageChangeservice} className="border rounded px-2 py-1">
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                </select>
            </div>
        </div>
    );
}, [filterValueservice, onSearchChangeservice, onRowsPerPageChangeservice, rowsPerPageService]);


    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400"></span>
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
    }, [page, pages, onNextPage, onPreviousPage]);

    const bottomContentservice = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400"></span>
                <Pagination
                    isCompact
                    showShadow
                    color="success"
                    page={pageService}
                    total={pageservices}
                    onChange={setPageService}
                    classNames={{
                        cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
                        item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
                    }}
                />
                <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={pageService === 1}
                        onClick={onPreviousPageService}
                    >
                        Previous
                    </Button>
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={pageService === pageservices}
                        onClick={onNextPageservice}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [pageService, pageservices, onNextPageservice, onPreviousPageService]);

    const handleSelectionChange = (keys: Selection) => {
        setSelectedKeys(keys as Set<string>);
    };

    const handleSelectionChangeservice = (keys: Selection) => {
        setSelectedKeysService(keys as Set<string>);
    };

    const renderCell = React.useCallback((item: Certificate, columnKey: string) => {
        return item[columnKey];
    }, []);

    const renderCellservice = React.useCallback((item: Service, columnKey: string) => {
        return item[columnKey];
    }, []);

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
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbPage>
                                        Dashboard
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex-1 flex flex-col p-4">
                    <div className="grid p-2 auto-rows-min gap-4 md:grid-cols-3">
                        <Card className="rounded-lg border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Total Certificates</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-bold">{certificates.length}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-lg border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Total Services</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-bold">{services.length}</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-lg border shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">Total Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-bold">{users.length}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex-1 p-2 py-4 overflow-hidden flex flex-col">
                            <Card className="h-full flex flex-col bg-background rounded-lg border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-3xl font-bold text-center">Certificate Record</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table
                                        isHeaderSticky
                                        aria-label="Certificates table"
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
                                                    align="start"
                                                    allowsSorting={column.sortable}
                                                >
                                                    {column.name}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody emptyContent={"No certificate available"} items={sortedItems}>
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
                        <div className="flex-1 p-2 overflow-hidden flex flex-col">
                            <Card className="h-full flex flex-col bg-background rounded-lg border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-3xl font-bold text-center">Service Record</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table
                                        isHeaderSticky
                                        aria-label="Services table"
                                        bottomContent={bottomContentservice}
                                        bottomContentPlacement="outside"
                                        classNames={{
                                            wrapper: "max-h-[382px] overflow-y-auto",
                                        }}
                                        selectedKeys={selectedKeysService}
                                        sortDescriptor={sortDescriptorService}
                                        topContent={topContentservice}
                                        topContentPlacement="outside"
                                        onSelectionChange={handleSelectionChangeservice}
                                        onSortChange={(descriptor) => {
                                            setSortDescriptorService({
                                                column: descriptor.column as string,
                                                direction: descriptor.direction as "ascending" | "descending",
                                            });
                                        }}
                                    >
                                        <TableHeader columns={headerColumnsservice}>
                                            {(column) => (
                                                <TableColumn
                                                    key={column.uid}
                                                    align="start"
                                                    allowsSorting={column.sortable}
                                                >
                                                    {column.name}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody emptyContent={"No service available"} items={sortedItemsservice}>
                                            {(item) => (
                                                <TableRow key={item._id}>
                                                    {(columnKey) => <TableCell style={{ fontSize: "12px", padding: "8px" }}>{renderCellservice(item, columnKey as string)}</TableCell>}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}