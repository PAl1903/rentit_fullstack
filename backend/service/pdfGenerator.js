// pdfGenerator.js

const { PDFDocument, StandardFonts } = require('pdf-lib');

async function generateReceiptPDF(bookingDetails) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    page.drawText('Receipt', {
        x: 50,
        y: height - 50,
        size: 24,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    });

    page.drawText(`Booking ID: ${bookingDetails._id}`, {
        x: 50,
        y: height - 100,
        size: 18,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
    });

    // Add more details as needed, e.g., amount, dates, customer info, etc.

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

module.exports = generateReceiptPDF;
