const Order = require('../model/order-model')
const moment = require('moment');
const puppeteer = require('puppeteer');
const excel = require('excel4node');
const ExcelJS = require('exceljs');


const salesReport = async (req, res, next) => {

    try {

        let { from, to } = req.query

        const today = moment().format('YYYY-MM-DD')
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD')
        const last7days = moment().subtract(7, 'days').format('YYYY-MM-DD')
        const last30days = moment().subtract(30, 'days').format('YYYY-MM-DD')
        const lastYear = moment().subtract(1, 'years').format('YYYY-MM-DD')

        if (!from || !to) {
            from = last30days
            to = today
        }

        if (from > to) [from, to] = [to, from]
        to += 'T23:59:59.999Z'


        const orders = await Order.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' }).populate('user')
        console.log('orders', orders)

        from = from.split('T')[0]
        to = to.split('T')[0]

        const netTotalAmount = orders.reduce((acc, order) => acc + order.totalAmount, 0)
        const netFinalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0)
        const netDiscount = orders.reduce((acc, order) => acc + order.discount, 0)
        const dateRanges = [

            { text: 'Today', from: today, to: today },
            { text: 'Yesterday', from: yesterday, to: yesterday },
            { text: 'Last 7 days', from: last7days, to: today },
            { text: 'Last 30 days', from: last30days, to: today },
            { text: 'Last year', from: lastYear, to: today },

        ]

        const ITEMS_PER_PAGE = 15
        const page = parseInt(req.query.page) || 1
        const skipItems = (page - 1) * ITEMS_PER_PAGE
        console.log("Count of Delivered Orders:", orders.length);
        const totalCount = orders.length
        const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)



        res.render('salesreportt', {
            orders, from, to, dateRanges, netTotalAmount, netFinalAmount, netDiscount,
            currentPage: page, totalPages: totalPages
        })
    } catch (error) {
        console.log(error)
        res.render('404')

    }
}



const adminDownloadReports = async (req, res, next) => {
    try {
        console.log("Hi")
        const { type } = req.params
        let { from, to } = req.query
        to += 'T23:59:59.999Z'
        const orders = await Order.find({ createdAt: { $gte: from, $lte: to }, orderStatus: 'Delivered' })
            .populate('user')
            .populate({
                path: 'items.product',
                model: 'product',
            });
        const netTotalAmount = orders.reduce((acc, order) => acc + order.finalAmount, 0)



        if (type === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Add "From" and "To" details
            worksheet.addRow(['', '', '', '', '', '', 'From', from]);
            worksheet.addRow(['', '', '', '', '', '', 'To', to.split('T')[0]]);
            worksheet.addRow(['', '', '', '', '', '', 'Total Orders', orders.length]);
            worksheet.addRow(['', '', '', '', '', '', 'Net Total Price', netTotalAmount]);

            // Add an empty row for separation
            worksheet.addRow([]);

            // Add the header row for the table
            worksheet.addRow([
                'SL. No',
                'Order ID',
                'Date',
              
                'Quantity',
                'Total Price',
                'Payment Mode',
            ]);

            // Set styles for the header
            worksheet.getRow(8).font = { bold: true, size: 16 };
            worksheet.getRow(8).alignment = { horizontal: 'center' };

            let count = 1;
            
            orders.forEach((order) => {
                order.s_no = count;
                order.oid = order._id.toString().replace(/"/g, '');
               
                // Map the fields from the order schema to the columns
                worksheet.addRow([
                    order.s_no,
                    order.oid,
                    order.createdAt.toISOString().split('T')[0],
               
                    order.items[0].quantity,
                    order.finalAmount,
                    order.paymentMode,
                ]);

                count += 1;
            });

            // Add an empty row for separation
            worksheet.addRow([]);

            // Add the summary row
            worksheet.addRow(['', '', '', '', '', '', 'Net Total Price', netTotalAmount]);
            worksheet.getRow(10 + orders.length).font = { bold: true };

            // Write the workbook to a file
            const filePath = `${__dirname}/../sales_report.xlsx`;
            await workbook.xlsx.writeFile(filePath);
            
            // Send the file as a response
            res.download(filePath);
        }


        else {
            const browser = await puppeteer.launch()
            const page = await browser.newPage()

            // Set content and styles for the PDF
            const content = `
                 <!DOCTYPE html>
                 <html lang="en">
 
                 <head>
                     <meta charset="UTF-8">
                     <meta name="viewport" content="width=device-width, initial-scale=1.0">
                     <title>Document</title>
                     <style>
                         .text-center {
                             text-align: center;
                         }
 
                         .text-end {
                             text-align: end;
                         }
 
                         .table-container {
 
                             width: 80%;
                             margin: 0 auto;
                             margin-top: 1.5rem;
                             border-radius: 5px;
                         }
 
                         table {
                             caption-side: bottom;
                             border-collapse: collapse;
                             margin-bottom: 1rem;
                             vertical-align: top;
                             border-color: #dee2e6;
                             border: 1px solid #ccc;
                             border-bottom: 1px solid #444;
                             width: 80%;
                             margin: 0 auto;
                             margin-top: 1.5rem;
                             border-radius: 10px;
                         }
 
                         thead {
                             border-color: inherit;
                             border-style: solid;
                             border-width: 0;
                             vertical-align: bottom;
                         }
 
                         tr {
                             font-size: 12px;
                             border-color: inherit;
                             border-style: solid;
                             border-width: 0;
                         }
 
                         td {
                             border-color: inherit;
                             border-style: solid;
                             border-width: 0;
                             padding: .5rem .5rem;
                             background-color: transparent;
                             border-bottom-width: 1px;
                             box-shadow: inset 0 0 0 9999px #fff;
                             max-width: 100px;
                             overflow: hidden;
                             text-overflow: ellipsis;
                             white-space: nowrap;
                         }
 
                         .d-flex-column {
                             display: flex;
                             flex-direction: column;
                         }
 
                         .fw-bold {
                             font-weight: bold;
                         }
 
                         * {
                             font-size: 14px;
                             color: #444;
                         }
                     </style>
                 </head>
 
                 <body>
                     <div>
                         <div class="text-center">
                             <h6>Sales reports</span>
                         </div>
 
                         <table>
                             <thead>
                                 <tr>
                                     <th scope="col">SL. No</th>
                                     <th scope="col">OrderId</th>
                                     <th scope="col">Date</th> 
                            
                                     <th scope="col">Quantity</th>
                                     <th scope="col">Total Price</th>
                                     <th scope="col">Payment Method</th>
                                 </tr>
                             </thead>
                             <tbody>
 
                                 ${orders
                    .map(
                        (order, index) => `
                                 <tr>
                                     <td>${index + 1}</td>
                                     <td>${order._id.toString().replace(/"/g, '')}</td>
                                     <td>${order.createdAt.toISOString().split('T')[0]}</td>
                              
                                     <td>${order.items[0].quantity}</td>
                                    
                                     <td>${order.finalAmount}</td>
                                     <td>${order.paymentMode}</td>
                                 </tr>`
                    )
                    .join('')}
 
                                 <tr>
                                     <td></td>
                                     <td></td>
                                     <td></td>
                                     <td></td>
                                     <td></td>
                                     <td></td>
                                     <td>
                                         <div class="d-flex-column text-end">
                                             <br>
                                             <span>Net Total Price:</span>
                                           
                                         </div>
                                     </td>
                                     <td class="">
                                         <div class="d-flex-column">
                                             <br>
                                             <span>${netTotalAmount}</span>
                                             
                                         </div>
                                     </td>
                                 </tr>
 
                             </tbody>
                         </table>
 
                     </div>
                 </body>
 
                 </html>`

            await page.setContent(content)
            await page.pdf({ path: 'sales_report.pdf', format: 'A4' })

            await browser.close()

            const file = `${__dirname}/../sales_report.pdf`;

            res.download(file)
        }
    } catch (error) {
        console.log(error)
        // next(error)
        res.render('404')
    }
}

module.exports = {
    salesReport,
    adminDownloadReports

}