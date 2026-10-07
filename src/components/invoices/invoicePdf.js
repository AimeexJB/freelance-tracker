import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { formatCurrency, toNumber } from '../../utils/currency'
import { formatDateDisplay } from '../../utils/dates'

// jsPDF's built-in fonts (Helvetica etc.) only support a narrow WinAnsi glyph
// set and garble currency symbols like ¥/€ when drawn directly. Rendering the
// invoice as real HTML through the browser's own font/text engine and
// rasterizing that with html2canvas sidesteps the problem entirely — any
// currency symbol (or future Japanese text) renders exactly as the browser
// shows it, at the cost of the PDF text no longer being selectable.
const PAGE_WIDTH = 794 // A4 at 96dpi
const PAGE_HEIGHT = 1123

function escapeHtml(value) {
  const div = document.createElement('div')
  div.textContent = String(value ?? '')
  return div.innerHTML
}

function buildInvoiceElement(invoice, client, businessInfo) {
  const currency = invoice.currency || 'JPY'

  const rows = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e4e1ec;">${escapeHtml(item.description)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e4e1ec;text-align:right;">${escapeHtml(item.quantity)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e4e1ec;text-align:right;">${escapeHtml(formatCurrency(item.rate, currency))}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e4e1ec;text-align:right;">${escapeHtml(
            formatCurrency(toNumber(item.quantity) * toNumber(item.rate), currency),
          )}</td>
        </tr>`,
    )
    .join('')

  const total = invoice.lineItems.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.rate), 0)

  const fromLines = [businessInfo?.name, businessInfo?.address, businessInfo?.email, businessInfo?.bankDetails]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('')

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-10000px'
  wrapper.style.top = '0'
  wrapper.style.width = `${PAGE_WIDTH}px`
  wrapper.style.background = '#ffffff'
  wrapper.style.color = '#1a1a1a'
  wrapper.style.fontFamily = "'Helvetica Neue', Arial, sans-serif"
  wrapper.style.padding = '48px'
  wrapper.style.boxSizing = 'border-box'
  wrapper.setAttribute('lang', 'en')

  wrapper.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:700;letter-spacing:0.03em;">INVOICE</div>
      <div style="font-size:13px;color:#555;">${escapeHtml(invoice.invoiceNumber)}</div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
      <div style="font-size:13px;line-height:1.7;">
        <div style="color:#8a8a8a;margin-bottom:4px;">From</div>
        ${fromLines || '<div>&nbsp;</div>'}
      </div>
      <div style="font-size:13px;line-height:1.7;text-align:right;">
        <div style="color:#8a8a8a;margin-bottom:4px;">Bill to</div>
        <div>${escapeHtml(client?.name ?? '')}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:24px;color:#333;">
      <div>Issue date: ${escapeHtml(formatDateDisplay(invoice.issueDate))}</div>
      <div>Due date: ${escapeHtml(formatDateDisplay(invoice.dueDate))}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#2b2438;color:#ffffff;">
          <th style="padding:10px 14px;text-align:left;font-weight:600;">Description</th>
          <th style="padding:10px 14px;text-align:right;font-weight:600;">Qty</th>
          <th style="padding:10px 14px;text-align:right;font-weight:600;">Rate</th>
          <th style="padding:10px 14px;text-align:right;font-weight:600;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:20px;font-size:16px;font-weight:700;">
      Total: ${escapeHtml(formatCurrency(total, currency))}
    </div>
    ${
      invoice.notes
        ? `<div style="margin-top:32px;font-size:12px;color:#555;">
             <div style="color:#8a8a8a;margin-bottom:4px;">Notes</div>
             <div style="white-space:pre-wrap;">${escapeHtml(invoice.notes)}</div>
           </div>`
        : ''
    }
  `

  return wrapper
}

export async function downloadInvoicePdf(invoice, client, businessInfo) {
  const element = buildInvoiceElement(invoice, client, businessInfo)
  document.body.appendChild(element)

  try {
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
    const doc = new jsPDF({ unit: 'px', format: 'a4' })
    const scaleFactor = canvas.width / PAGE_WIDTH
    const sliceHeightPx = PAGE_HEIGHT * scaleFactor

    let renderedHeight = 0
    let isFirstPage = true

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(sliceHeightPx, canvas.height - renderedHeight)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeight
      const ctx = sliceCanvas.getContext('2d')
      ctx.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

      if (!isFirstPage) doc.addPage()
      doc.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_WIDTH, sliceHeight / scaleFactor)

      renderedHeight += sliceHeightPx
      isFirstPage = false
    }

    doc.save(`${invoice.invoiceNumber}.pdf`)
  } finally {
    document.body.removeChild(element)
  }
}
