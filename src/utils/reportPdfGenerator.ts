import PDFDocument from 'pdfkit';

export interface ReportColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface ReportMetric {
  label: string;
  value: string;
}

export interface GeneratePdfOptions {
  reportType: string;
  title: string;
  subtitle?: string;
  dateRange: string;
  metrics: ReportMetric[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totals?: Record<string, string>;
}

export function generateReportPdfBuffer(options: GeneratePdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 36,
        bufferPages: true, // Needed for total page count calculation
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', err => {
        reject(err);
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      const bottomLimit = pageHeight - margin - 30; // space for footer

      // --- Helper: Draw Top Accent Bar ---
      const drawAccentBar = () => {
        doc.rect(margin, margin - 10, contentWidth, 4).fill('#4338ca');
      };

      // --- Helper: Draw Header ---
      const drawHeader = () => {
        drawAccentBar();
        
        // Brand & Title
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1e1b4b').text('HappyPets Store', margin, margin + 4);
        doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Analytics & Financial Intelligence Reports', margin, margin + 24);

        // Report Name
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#4338ca').text(options.title, margin, margin + 38);
        if (options.subtitle) {
          doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text(options.subtitle, margin, margin + 54);
        }

        // Right side: Metadata
        const metaX = pageWidth - margin - 220;
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155').text('Date Range: ', metaX, margin + 14, { continued: true });
        doc.font('Helvetica').fillColor('#64748b').text(options.dateRange);

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155').text('Generated: ', metaX, margin + 28, { continued: true });
        doc.font('Helvetica').fillColor('#64748b').text(new Date().toLocaleString());

        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155').text('Report Type: ', metaX, margin + 42, { continued: true });
        doc.font('Helvetica').fillColor('#4338ca').text(options.reportType.toUpperCase());

        doc.moveTo(margin, margin + 68).lineTo(pageWidth - margin, margin + 68).strokeColor('#e2e8f0').lineWidth(1).stroke();
      };

      // --- Helper: Draw KPI Cards ---
      const drawKpis = (startY: number): number => {
        if (!options.metrics || options.metrics.length === 0) return startY;

        const count = Math.min(options.metrics.length, 5);
        const cardGap = 10;
        const totalGap = cardGap * (count - 1);
        const cardWidth = (contentWidth - totalGap) / count;
        const cardHeight = 44;

        options.metrics.slice(0, count).forEach((metric, index) => {
          const cardX = margin + index * (cardWidth + cardGap);

          // Card background & subtle border
          doc.roundedRect(cardX, startY, cardWidth, cardHeight, 5)
            .fillAndStroke('#f8fafc', '#e2e8f0');

          // Metric Label
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b')
            .text(metric.label.toUpperCase(), cardX + 8, startY + 8, {
              width: cardWidth - 16,
              align: 'left',
              lineBreak: false
            });

          // Metric Value
          doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b')
            .text(metric.value, cardX + 8, startY + 22, {
              width: cardWidth - 16,
              align: 'left',
              lineBreak: false
            });
        });

        return startY + cardHeight + 14;
      };

      // --- Helper: Draw Table Header ---
      const drawTableHeader = (startY: number): number => {
        const headerHeight = 22;
        doc.rect(margin, startY, contentWidth, headerHeight).fill('#4338ca');

        let currentX = margin;
        options.columns.forEach(col => {
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff')
            .text(col.header, currentX + 6, startY + 6, {
              width: col.width - 12,
              align: col.align || 'left',
              lineBreak: false
            });
          currentX += col.width;
        });

        return startY + headerHeight;
      };

      // Initial Page Header & KPI Cards
      drawHeader();
      let currentY = drawKpis(margin + 78);

      // Scale column widths to fit contentWidth exactly if needed
      const rawColsTotalWidth = options.columns.reduce((s, c) => s + c.width, 0);
      const scaleFactor = contentWidth / rawColsTotalWidth;
      const scaledColumns = options.columns.map(col => ({
        ...col,
        width: Math.floor(col.width * scaleFactor)
      }));
      // Adjust any rounding residue to the last column
      const scaledTotal = scaledColumns.reduce((s, c) => s + c.width, 0);
      if (scaledColumns.length > 0) {
        scaledColumns[scaledColumns.length - 1].width += (contentWidth - scaledTotal);
      }

      // Draw table header
      currentY = drawTableHeader(currentY);

      // Draw Data Rows
      const rowHeight = 19;
      if (options.rows.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748b')
          .text('No records found for the selected criteria and date range.', margin + 10, currentY + 12, {
            align: 'center',
            width: contentWidth - 20
          });
        currentY += 36;
      } else {
        options.rows.forEach((row, rowIndex) => {
          // Check page break
          if (currentY + rowHeight > bottomLimit) {
            doc.addPage();
            drawHeader();
            currentY = drawTableHeader(margin + 78);
          }

          // Alternating row background
          const rowBg = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(margin, currentY, contentWidth, rowHeight).fill(rowBg);
          // Row separator line
          doc.moveTo(margin, currentY + rowHeight)
            .lineTo(pageWidth - margin, currentY + rowHeight)
            .strokeColor('#f1f5f9')
            .lineWidth(0.5)
            .stroke();

          // Cell text
          let currentX = margin;
          scaledColumns.forEach(col => {
            const rawVal = row[col.key];
            const valStr = rawVal !== undefined && rawVal !== null ? String(rawVal) : '-';

            doc.font('Helvetica').fontSize(8).fillColor('#334155')
              .text(valStr, currentX + 6, currentY + 5, {
                width: col.width - 12,
                align: col.align || 'left',
                lineBreak: false
              });

            currentX += col.width;
          });

          currentY += rowHeight;
        });
      }

      // Draw Totals Row if present
      if (options.totals) {
        if (currentY + rowHeight + 6 > bottomLimit) {
          doc.addPage();
          drawHeader();
          currentY = drawTableHeader(margin + 78);
        }

        doc.rect(margin, currentY, contentWidth, rowHeight + 3).fill('#e0e7ff');
        doc.moveTo(margin, currentY)
          .lineTo(pageWidth - margin, currentY)
          .strokeColor('#818cf8')
          .lineWidth(1)
          .stroke();

        let currentX = margin;
        scaledColumns.forEach((col, idx) => {
          let text = options.totals![col.key] || '';
          if (idx === 0 && !text) {
            text = 'Total / Summary:';
          }

          doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#312e81')
            .text(text, currentX + 6, currentY + 6, {
              width: col.width - 12,
              align: col.align || 'left',
              lineBreak: false
            });

          currentX += col.width;
        });

        currentY += rowHeight + 4;
      }

      // Final pass: Add Footers with Page Numbers to all buffered pages
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Footer divider line
        doc.moveTo(margin, pageHeight - margin - 14)
          .lineTo(pageWidth - margin, pageHeight - margin - 14)
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .stroke();

        // Footer left text
        doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8')
          .text('HappyPets E-Commerce Platform • Internal & Confidential Management Report', margin, pageHeight - margin - 8);

        // Footer right page number
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#64748b')
          .text(`Page ${i + 1} of ${totalPages}`, pageWidth - margin - 100, pageHeight - margin - 8, {
            width: 100,
            align: 'right'
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function generateReportCsv(
  columns: { header: string; key: string }[],
  rows: Record<string, any>[]
): string {
  const escapeCsv = (val: any): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = columns.map(c => escapeCsv(c.header)).join(',');
  const rowLines = rows.map(r => columns.map(c => escapeCsv(r[c.key])).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}
