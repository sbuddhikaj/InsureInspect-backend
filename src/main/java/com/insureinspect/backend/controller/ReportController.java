package com.insureinspect.backend.controller;

import com.insureinspect.backend.model.*;
import com.insureinspect.backend.repository.JobRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private JobRepository jobRepository;

    @GetMapping("/jobs/{jobId}/pdf")
    public void exportJobReportPdf(@PathVariable Long jobId, HttpServletResponse response) throws IOException {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            response.sendError(HttpStatus.NOT_FOUND.value(), "Job not found");
            return;
        }
        Job job = jobOpt.get();

        response.setContentType("application/pdf");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Job_Report_" + jobId + ".pdf");

        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        PdfWriter.getInstance(document, response.getOutputStream());

        document.open();

        // Title Section
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD);
        Paragraph title = new Paragraph("InsureInspect Job Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Claim Info Table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(20);

        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Font.NORMAL);

        addCell(table, "Job ID:", labelFont);
        addCell(table, "#" + job.getId(), valueFont);
        addCell(table, "Title:", labelFont);
        addCell(table, job.getTitle(), valueFont);
        addCell(table, "Client Name:", labelFont);
        addCell(table, job.getClientName(), valueFont);
        addCell(table, "Address:", labelFont);
        addCell(table, job.getAddress(), valueFont);
        addCell(table, "Phone:", labelFont);
        addCell(table, job.getPhone(), valueFont);
        addCell(table, "Policy Number:", labelFont);
        addCell(table, job.getPolicyNumber(), valueFont);
        addCell(table, "Scheduled Date:", labelFont);
        addCell(table, job.getScheduledDate(), valueFont);
        addCell(table, "Status:", labelFont);
        addCell(table, job.getStatus(), valueFont);

        document.add(table);

        // Claim Details Description
        Font sectionHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Font.BOLD);
        Paragraph detailHeader = new Paragraph("Claim Description Details", sectionHeaderFont);
        detailHeader.setSpacingAfter(6);
        document.add(detailHeader);

        Paragraph detailText = new Paragraph(job.getClaimDetails(), valueFont);
        detailText.setSpacingAfter(20);
        document.add(detailText);

        // Overall Severity & Damage Evaluation
        Paragraph evalHeader = new Paragraph("Overall Damage Evaluation", sectionHeaderFont);
        evalHeader.setSpacingAfter(6);
        document.add(evalHeader);

        PdfPTable evalTable = new PdfPTable(2);
        evalTable.setWidthPercentage(100);
        evalTable.setSpacingAfter(20);
        addCell(evalTable, "Severity Level:", labelFont);
        addCell(evalTable, job.getDamageSeverity() != null ? job.getDamageSeverity() : "N/A", valueFont);
        addCell(evalTable, "Structural Damage:", labelFont);
        addCell(evalTable, job.isStructuralDamage() ? "Yes" : "No", valueFont);
        addCell(evalTable, "Roof Damage:", labelFont);
        addCell(evalTable, job.isRoofDamage() ? "Yes" : "No", valueFont);
        addCell(evalTable, "Water Damage:", labelFont);
        addCell(evalTable, job.isWaterDamage() ? "Yes" : "No", valueFont);
        addCell(evalTable, "Overall Investigation Notes:", labelFont);
        addCell(evalTable, job.getNotes() != null ? job.getNotes() : "No notes submitted.", valueFont);

        document.add(evalTable);

        // Site Visits Section
        Paragraph visitsHeader = new Paragraph("Site Inspection Visits Timeline", sectionHeaderFont);
        visitsHeader.setSpacingAfter(10);
        document.add(visitsHeader);

        if (job.getSiteVisits().isEmpty()) {
            document.add(new Paragraph("No site visits recorded.", valueFont));
        } else {
            int visitNum = 1;
            for (SiteVisit visit : job.getSiteVisits()) {
                Paragraph vTitle = new Paragraph("Visit #" + visitNum++ + " - Checked: " + visit.getVisitDate(), labelFont);
                vTitle.setSpacingBefore(10);
                vTitle.setSpacingAfter(6);
                document.add(vTitle);

                PdfPTable vTable = new PdfPTable(2);
                vTable.setWidthPercentage(100);
                vTable.setSpacingAfter(10);

                if (visit.getSiteRoomType() != null) {
                    addCell(vTable, "First Visit Property Info:", labelFont);
                    addCell(vTable, "Room: " + visit.getSiteRoomType() + " | Other locations: " + (visit.getOtherLocationsData() != null ? visit.getOtherLocationsData() : "None"), valueFont);
                }

                addCell(vTable, "Readings (Moisture / Temp / Humidity):", labelFont);
                String moistureStr = visit.getMoisture() != null ? visit.getMoisture() + "%" : "N/A";
                String tempStr = visit.getTemperature() != null ? visit.getTemperature() + "°F" : "N/A";
                String humidityStr = visit.getHumidity() != null ? visit.getHumidity() + "%" : "N/A";
                addCell(vTable, "Moisture: " + moistureStr + " | Temp: " + tempStr + " | Humidity: " + humidityStr, valueFont);

                addCell(vTable, "Checklists (Structural / Roof / Water):", labelFont);
                addCell(vTable, "Structural: " + (visit.isStructuralDamage() ? "Yes" : "No") + " | Roof: " + (visit.isRoofDamage() ? "Yes" : "No") + " | Water: " + (visit.isWaterDamage() ? "Yes" : "No"), valueFont);

                addCell(vTable, "Visit Notes:", labelFont);
                addCell(vTable, visit.getNotes() != null ? visit.getNotes() : "None", valueFont);

                document.add(vTable);

                // Compliance Forms under visit
                if (visit.getComplianceForms() != null && !visit.getComplianceForms().isEmpty()) {
                    Paragraph compHeader = new Paragraph("Compliance Checklists:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD));
                    compHeader.setSpacingAfter(4);
                    document.add(compHeader);

                    PdfPTable compTable = new PdfPTable(4);
                    compTable.setWidthPercentage(100);
                    compTable.setSpacingAfter(10);

                    addCell(compTable, "Form Type", labelFont);
                    addCell(compTable, "Pre-existing?", labelFont);
                    addCell(compTable, "Safety Checked?", labelFont);
                    addCell(compTable, "Authorized By", labelFont);

                    for (ComplianceForm form : visit.getComplianceForms()) {
                        addCell(compTable, form.getFormType(), valueFont);
                        addCell(compTable, form.isPreExistingDamage() ? "Yes" : "No", valueFont);
                        addCell(compTable, form.isSafetyCheckPassed() ? "Yes" : "No", valueFont);
                        addCell(compTable, form.isCustomerAuthorized() ? form.getAuthorizedSignatureName() : "Not Authorized", valueFont);
                    }
                    document.add(compTable);
                }

                // Room Locations under visit
                if (visit.getRoomLocations() != null && !visit.getRoomLocations().isEmpty()) {
                    Paragraph roomsHeader = new Paragraph("Inspected Rooms & Areas:", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Font.BOLD));
                    roomsHeader.setSpacingAfter(4);
                    document.add(roomsHeader);

                    for (RoomLocation rl : visit.getRoomLocations()) {
                        Paragraph rlTitle = new Paragraph("• Room: " + rl.getRoomType() + " (" + (rl.getDimensions() != null ? rl.getDimensions() : "N/A") + ")", labelFont);
                        rlTitle.setSpacingAfter(4);
                        document.add(rlTitle);

                        if (rl.getDetails() != null && !rl.getDetails().trim().isEmpty()) {
                            Paragraph rlDetails = new Paragraph("Notes: " + rl.getDetails(), valueFont);
                            rlDetails.setIndentationLeft(15);
                            rlDetails.setSpacingAfter(4);
                            document.add(rlDetails);
                        }

                        // Deployed Equipment
                        if (rl.getEquipments() != null && !rl.getEquipments().isEmpty()) {
                            StringBuilder eqSb = new StringBuilder("Equipment: ");
                            for (Equipment eq : rl.getEquipments()) {
                                eqSb.append(eq.getName())
                                    .append(eq.getSerialNumber() != null ? " (S/N: " + eq.getSerialNumber() + ")" : "")
                                    .append(" [").append(eq.getStatus()).append("], ");
                            }
                            Paragraph rlEq = new Paragraph(eqSb.substring(0, eqSb.length() - 2), valueFont);
                            rlEq.setIndentationLeft(15);
                            rlEq.setSpacingAfter(4);
                            document.add(rlEq);
                        }
                    }
                }
            }
        }

        document.close();
    }

    @GetMapping("/jobs/{jobId}/excel")
    public void exportJobInventoryExcel(@PathVariable Long jobId, HttpServletResponse response) throws IOException {
        Optional<Job> jobOpt = jobRepository.findById(jobId);
        if (jobOpt.isEmpty()) {
            response.sendError(HttpStatus.NOT_FOUND.value(), "Job not found");
            return;
        }
        Job job = jobOpt.get();

        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Job_Inventory_" + jobId + ".xlsx");

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Cataloged Inventory");

        // Create headers
        org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
        String[] headers = {"Item ID", "Room/Location", "Category", "Item Name", "Quantity", "Loss Type", "Description Notes"};
        
        CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        for (int i = 0; i < headers.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (SiteVisit sv : job.getSiteVisits()) {
            for (RoomLocation rl : sv.getRoomLocations()) {
                if (rl.getInventoryItems() != null) {
                    for (InventoryItem item : rl.getInventoryItems()) {
                        org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                        row.createCell(0).setCellValue(item.getId() != null ? item.getId().toString() : "PENDING");
                        row.createCell(1).setCellValue(rl.getRoomType());
                        row.createCell(2).setCellValue(item.getCategory() != null ? item.getCategory() : "N/A");
                        row.createCell(3).setCellValue(item.getName());
                        row.createCell(4).setCellValue(item.getQuantity() != null ? item.getQuantity() : 1);
                        row.createCell(5).setCellValue(item.getLossType() != null ? item.getLossType() : "N/A");
                        row.createCell(6).setCellValue(item.getDescription() != null ? item.getDescription() : "");
                    }
                }
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        workbook.write(response.getOutputStream());
        workbook.close();
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Paragraph(text != null ? text : "", font));
        cell.setPadding(5);
        table.addCell(cell);
    }
}
