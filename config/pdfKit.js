const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoice = async (order,productDetails) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const invoicePath = path.join("config/Invoices", "invoicenew.pdf"); // Path to save the generated PDF

    // Pipe PDF document to a writable stream
    doc.pipe(fs.createWriteStream(invoicePath));

    // Set font styles
    doc.font('Helvetica');
    doc.fontSize(12);

    // Add content to the PDF
    doc.text("Invoice", { underline: true }).moveDown();
    doc.font('Helvetica-Bold').fontSize(25).fillColor("black");
    doc.text("Cam Heaven", { align: "center" }).moveDown();

    // Add delivery address field
    doc.text("Delivery Address:", { underline: true, fontSize: 14 }).moveDown();
    doc.fontSize(10);
    order.forEach((orders)=>{
    doc.text(`Name: ${orders?.deliveryDetails?.name}`);
    doc.text(`Mobile Number: ${orders?.deliveryDetails?.mobile}`);
    doc.text(`Address: ${orders?.deliveryDetails?.address}`);
    doc.text(`Postal Code: ${orders?.deliveryDetails?.pincode}`).moveDown();
    })
    // doc.text(`Postal Code: ${invoiceData?.pincode}`);
    // doc.text(`Mobile Number: ${invoiceData?.phone}`).moveDown();

    // Add seller address field
    doc.text("Seller Address:", { underline: true, fontSize: 14 }).moveDown();
    doc.fontSize(10);
    doc.text(`Name: CamHeaven`);
    doc.text(`Street: Edappally`);
    doc.text(`City: Cochin`);
    doc.text(`State: Kerala`);
    doc.text(`Postal Code: 652034`);
    doc.text(`Mobile Number: 9496959109`).moveDown();

    doc.text("------------------------------").moveDown();
    doc.fontSize(16).text("Items:", { underline: true }).moveDown();
    productDetails.forEach((item) => {
      doc.text(`${item.product.name} - ${item.quantity} - Rs ${item.product.price} `);
    });
    doc.text("------------------------------").moveDown();
    order.forEach((orders)=>{
    doc.fontSize(10).text(`payment_Method: ${orders.paymentMethod}`).moveDown();
    doc.fontSize(16).text(`Total: Rs ${orders.totalAmount}`).moveDown();
    })
    // End the PDF document
    doc.end();

    // Resolve with the generated invoice file path
    resolve(invoicePath);
  });
};

  

module.exports = generateInvoice