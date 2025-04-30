"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, ChevronDownIcon, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  
  Pagination,
  Tooltip,
} from "@heroui/react";
import axios from "axios";
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
  [key: string]: string | Observation[] | undefined;
}

type SortDescriptor = {
  column: string;
  direction: "ascending" | "descending";
};

const generateUniqueId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch {
    return "Invalid Date";
  }
};

const columns = [
  { name: "Certificate Number", uid: "certificateNo", sortable: true, width: "120px" },
  { name: "Customer Name", uid: "customerName", sortable: true, width: "120px" },
  { name: "Site Location", uid: "siteLocation", sortable: true, width: "120px" },
  { name: "Model", uid: "makeModel", sortable: true, width: "120px" },
  { name: "Serial Number", uid: "serialNo", sortable: true, width: "120px" },
  { name: "Engineer Name", uid: "engineerName", sortable: true, width: "120px" },
  { name: "Date of Calibration", uid: "dateOfCalibration", sortable: true, width: "120px" },
  { name: "Download", uid: "actions", sortable: false, width: "100px" },
];

export default function Certificatetable() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set([]));
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "dateOfCalibration",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [filterValue, setFilterValue] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/v1/certificates/getCertificate",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      let certificatesData;
      if (typeof response.data === "object" && "data" in response.data) {
        certificatesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        certificatesData = response.data;
      } else {
        certificatesData = [];
      }

      const sortedData = certificatesData.sort((a: Certificate, b: Certificate) => {
        const dateA = new Date(a.dateOfCalibration || "").getTime();
        const dateB = new Date(b.dateOfCalibration || "").getTime();
        return dateB - dateA;
      });

      const certificatesWithKeys = sortedData.map((certificate: Certificate) => ({
        ...certificate,
        key: certificate._id || generateUniqueId(),
      }));

      setCertificates(certificatesWithKeys);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      setCertificates([]);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredCertificates = [...certificates];

    if (hasSearchFilter) {
      filteredCertificates = filteredCertificates.filter((certificate) =>
        ["certificateNo", "customerName", "siteLocation", "makeModel", "serialNo", "engineerName"].some((field) =>
          (certificate[field] as string).toLowerCase().includes(filterValue.toLowerCase())
        )
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

        return (!start || calibrationDate >= start) && (!end || calibrationDate <= end);
      });
    }

    return filteredCertificates;
  }, [certificates, filterValue, hasSearchFilter, startDate, endDate]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Certificate];
      const second = b[sortDescriptor.column as keyof Certificate];

      if (sortDescriptor.column.includes("Date")) {
        const dateA = new Date(first as string).getTime();
        const dateB = new Date(second as string).getTime();
        const cmp = dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      }

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
  
      // Logo positioning
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
  
      const formatDate = (dateString: string | null | undefined): string => {
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
        doc.text(": " + (value ?? "N/A"), valueX, y);
        y += lineGap;
      };
  
      addRow("Certificate No.", certificateToDownload.certificateNo ?? "N/A");
      addRow("Customer Name", certificateToDownload.customerName ?? "N/A");
      addRow("Site Location", certificateToDownload.siteLocation ?? "N/A");
      addRow("Make & Model", certificateToDownload.makeModel ?? "N/A");
      addRow("Range", certificateToDownload.range ?? "N/A");
      addRow("Serial No.", certificateToDownload.serialNo ?? "N/A");
      addRow("Calibration Gas", certificateToDownload.calibrationGas ?? "N/A");
      addRow("Gas Canister Details", certificateToDownload.gasCanisterDetails ?? "N/A");
  
      y += 5;
      addRow("Date of Calibration", formatDate(certificateToDownload.dateOfCalibration));
      addRow("Calibration Due Date", formatDate(certificateToDownload.calibrationDueDate));
      addRow("Status", certificateToDownload.status ?? "N/A");
  
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
          obs.gas ?? "N/A",
          obs.before ?? "N/A",
          obs.after ?? "N/A"
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
      doc.text(certificateToDownload.engineerName ?? "________________", pageWidth - rightMargin, y + 10, { align: "right" });
  
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

  const renderCell = useCallback((certificate: Certificate, columnKey: string): React.ReactNode => {
    const cellValue = certificate[columnKey];
  
    if (columnKey === "dateOfCalibration" || columnKey === "calibrationDueDate") {
      return formatDate(cellValue as string);
    }
  
    if (columnKey === "actions") {
      return (
        <Tooltip content="Download PDF">
          <span
            className="text-lg text-danger cursor-pointer active:opacity-50"
            onClick={() => certificate._id && handleDownload(certificate._id)}
          >
            <Download className="h-6 w-6" />
          </span>
        </Tooltip>
      );
    }
  
    if (Array.isArray(cellValue)) {
      return cellValue.map((obs, index) => (
        <div key={index}>{`${obs.gas}: ${obs.before} → ${obs.after}`}</div>
      ));
    }
  
    return cellValue ?? "N/A";
  }, [handleDownload]);

  const topContent = useMemo(() => {
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
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>
              Clear Dates
            </Button>
          )}
        </div>
      </div>
    );
  }, [filterValue, startDate, endDate]);

  const bottomContent = (
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
        />
      </div>
      <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
        <Button variant="default" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Button variant="default" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <Table
      isHeaderSticky
      aria-label="Certificates table"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{ wrapper: "max-h-[382px] overflow-y-auto" }}
      selectedKeys={selectedKeys}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={(keys) =>
        setSelectedKeys(keys === "all" ? new Set(certificates.map(cert => cert._id)) : keys as Set<string>)
      }
      onSortChange={(descriptor) => setSortDescriptor(descriptor as SortDescriptor)}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            <div className="flex items-center">
              {column.name}
              {sortDescriptor.column === column.uid && (
                <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${sortDescriptor.direction === "ascending" ? "rotate-180" : ""}`} />
              )}
            </div>
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No certificates found."} items={sortedItems}>
        {(item) => (
          <TableRow key={item._id}>
            {(columnKey) => (
              <TableCell style={{ fontSize: "12px", padding: "8px" }}>
                {renderCell(item, columnKey as string)}
              </TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}