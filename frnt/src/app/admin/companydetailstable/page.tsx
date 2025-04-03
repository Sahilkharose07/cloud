'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";
import { Loader2, SearchIcon, Edit2Icon, DeleteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/admin/adminComponents/page";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { ModeToggle } from "@/components/ModeToggle";
import { Pagination, Tooltip } from "@heroui/react";

interface CompanyDetails {
    _id: string;
    companyName: string;
    address: string;
    gstNumber: string;
    industries: string;
    website: string;
    industriesType: string;
    flage: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const columns = [
    { name: "COMPANY NAME", uid: "companyName", sortable: true, width: "120px" },
    { name: "ADDRESS", uid: "address", sortable: true, width: "120px" },
    { name: "GST NUMBER", uid: "gstNumber", sortable: true, width: "120px" },
    { name: "INDUSTRIES", uid: "industries", sortable: true, width: "120px" },
    { name: "WEBSITE", uid: "website", sortable: true, width: "120px" },
    { name: "INDUSTRIES TYPE", uid: "industriesType", sortable: true, width: "120px" },
    { name: "FLAG", uid: "flage", sortable: true, width: "120px" },
    { name: "ACTION", uid: "actions", sortable: false, width: "100px" },
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "address", "gstNumber", "industries", "website", "industriesType", "flage", "actions"];

export default function CompanyDetailsTable() {
    const [companies, setCompanies] = useState<CompanyDetails[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [page, setPage] = useState(1);
    const [filterValue, setFilterValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "companyName",
        direction: "ascending" as "ascending" | "descending",
    });

    const router = useRouter();
    const hasSearchFilter = Boolean(filterValue);

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/v1/companydetails/getcompanies",
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            let companiesData = Array.isArray(response.data) ? response.data : 
                              response.data?.data ? response.data.data : [];
            
            const companiesWithKeys = companiesData.map((company: CompanyDetails) => ({
                ...company,
                key: company._id || generateUniqueId()
            }));

            setCompanies(companiesWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching companies:", error);
            setError("Failed to fetch companies. Please try again.");
            setCompanies([]);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = async (companyId: string) => {
        if (!window.confirm("Are you sure you want to delete this company?")) {
            return;
        }

        try {
            await axios.delete(
                `http://localhost:5000/api/v1/companydetails/deleteCompany/${companyId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            setCompanies(prev => prev.filter(company => company._id !== companyId));
            toast.success("Company deleted successfully");
        } catch (error) {
            console.error("Error deleting company:", error);
            toast.error("Failed to delete company");
        }
    };

    const headerColumns = React.useMemo(() => {
        return columns.filter(column => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filtered = [...companies];
        
        if (hasSearchFilter) {
            const searchLower = filterValue.toLowerCase();
            filtered = filtered.filter(company => 
                company.companyName.toLowerCase().includes(searchLower) ||
                company.gstNumber.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [companies, filterValue, hasSearchFilter]);

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof CompanyDetails] || "";
            const second = b[sortDescriptor.column as keyof CompanyDetails] || "";
            
            let cmp = 0;
            if (first < second) cmp = -1;
            if (first > second) cmp = 1;
            
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [filteredItems, sortDescriptor]);

    const paginatedItems = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return sortedItems.slice(start, start + rowsPerPage);
    }, [sortedItems, page, rowsPerPage]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    const onNextPage = useCallback(() => {
        if (page < pages) setPage(page + 1);
    }, [page, pages]);

    const onPreviousPage = useCallback(() => {
        if (page > 1) setPage(page - 1);
    }, [page]);

    const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const renderCell = useCallback((company: CompanyDetails, columnKey: string) => {
        if (columnKey === "actions") {
            return (
                <div className="flex gap-2">
                    <Tooltip content="Edit">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.push(`/admin/addcategory?id=${company._id}`)}
                        >
                            <Edit2Icon className="h-4 w-4" />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Delete">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(company._id)}
                        >
                            <DeleteIcon className="h-4 w-4" />
                        </Button>
                    </Tooltip>
                </div>
            );
        }
        return company[columnKey as keyof CompanyDetails];
    }, [router]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <ModeToggle />
                    <Separator orientation="vertical" className="h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/addmodel">
                                    Add Model
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/admin/admincompany">
                                    Admin Company
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Company Details</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="container mx-auto py-6 px-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Company Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Input
                                        placeholder="Search companies..."
                                        className="max-w-sm"
                                        startContent={<SearchIcon className="h-4 w-4" />}
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {companies.length} companies
                                        </span>
                                        <select
                                            className="bg-background border rounded-md px-2 py-1 text-sm"
                                            value={rowsPerPage}
                                            onChange={onRowsPerPageChange}
                                        >
                                            <option value="5">5 per page</option>
                                            <option value="10">10 per page</option>
                                            <option value="15">15 per page</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="rounded-md border">
                                    <Table
                                        aria-label="Company details table"
                                        selectionMode="multiple"
                                        selectedKeys={selectedKeys}
                                        onSelectionChange={setSelectedKeys}
                                        sortDescriptor={sortDescriptor}
                                        onSortChange={setSortDescriptor}
                                    >
                                        <TableHeader columns={headerColumns}>
                                            {(column) => (
                                                <TableColumn
                                                    key={column.uid}
                                                    allowsSorting={column.sortable}
                                                >
                                                    {column.name}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody items={paginatedItems}>
                                            {(item) => (
                                                <TableRow key={item._id}>
                                                    {(columnKey) => (
                                                        <TableCell>
                                                            {renderCell(item, columnKey as string)}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-between items-center">
                                    <Pagination
                                        page={page}
                                        total={pages}
                                        onChange={setPage}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={page === 1}
                                            onClick={onPreviousPage}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={page >= pages}
                                            onClick={onNextPage}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}