export interface ReceiptSettings {
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  receipt_header?: string;
  receipt_footer?: string;
  paper_size?: '80mm' | '58mm';
  show_logo?: boolean;
  show_cashier?: boolean;
  show_qr?: boolean;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ReceiptData {
  transaction_number?: string;
  transaction_date: string;
  customer_name?: string;
  cashier_name?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paid_amount?: number;
  change_amount?: number;
  payment_method?: string;
  points_earned?: number;
  points_used?: number;
  notes?: string;
}

export const generateReceiptHTML = (
  data: ReceiptData,
  settings: ReceiptSettings = {}
): string => {
  const {
    store_name = 'Nama Toko',
    store_address = 'Alamat Toko',
    store_phone = 'No. Telepon',
    receipt_header = '',
    receipt_footer = 'Terima kasih atas kunjungan Anda!',
    paper_size = '80mm',
    show_cashier = true,
  } = settings;

  const paperWidth = paper_size === '80mm' ? '302px' : '226px';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt</title>
      <style>
        @media print {
          @page { 
            size: ${paper_size} auto; 
            margin: 0;
          }
          body { 
            margin: 0;
            padding: 0;
          }
        }
        
        body {
          font-family: 'Courier New', monospace;
          width: ${paperWidth};
          margin: 0 auto;
          padding: 10px;
          font-size: 12px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .store-info {
          font-size: 11px;
          line-height: 1.4;
        }
        
        .receipt-header {
          margin: 10px 0;
          font-size: 11px;
          text-align: center;
        }
        
        .transaction-info {
          margin: 10px 0;
          font-size: 11px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        
        .items {
          margin: 10px 0;
        }
        
        .item {
          margin-bottom: 8px;
        }
        
        .item-name {
          font-weight: bold;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        
        .totals {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 11px;
        }
        
        .total-row.grand-total {
          font-weight: bold;
          font-size: 14px;
          margin-top: 5px;
        }
        
        .payment-info {
          margin: 10px 0;
          font-size: 11px;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${store_name}</div>
        <div class="store-info">
          ${store_address}<br>
          ${store_phone}
        </div>
      </div>
      
      ${receipt_header ? `<div class="receipt-header">${receipt_header}</div>` : ''}
      
      <div class="transaction-info">
        ${data.transaction_number ? `<div>No: ${data.transaction_number}</div>` : ''}
        <div>Tanggal: ${new Date(data.transaction_date).toLocaleString('id-ID')}</div>
        ${data.customer_name ? `<div>Pelanggan: ${data.customer_name}</div>` : ''}
        ${show_cashier && data.cashier_name ? `<div>Kasir: ${data.cashier_name}</div>` : ''}
      </div>
      
      <div class="items">
        ${data.items.map(item => `
          <div class="item">
            <div class="item-name">${item.name}</div>
            <div class="item-details">
              <span>${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')}</span>
              <span>Rp ${item.total_price.toLocaleString('id-ID')}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>Rp ${data.subtotal.toLocaleString('id-ID')}</span>
        </div>
        ${data.discount ? `
          <div class="total-row">
            <span>Diskon:</span>
            <span>Rp ${data.discount.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
        ${data.points_used ? `
          <div class="total-row">
            <span>Poin Digunakan:</span>
            <span>${data.points_used} poin</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>Rp ${data.total.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      ${data.paid_amount !== undefined ? `
        <div class="payment-info">
          <div class="total-row">
            <span>Bayar:</span>
            <span>Rp ${data.paid_amount.toLocaleString('id-ID')}</span>
          </div>
          ${data.change_amount !== undefined ? `
            <div class="total-row">
              <span>Kembalian:</span>
              <span>Rp ${data.change_amount.toLocaleString('id-ID')}</span>
            </div>
          ` : ''}
          ${data.payment_method ? `
            <div class="total-row">
              <span>Metode:</span>
              <span>${data.payment_method}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${data.points_earned ? `
        <div class="payment-info">
          <div class="total-row">
            <span>Poin Didapat:</span>
            <span>${data.points_earned} poin</span>
          </div>
        </div>
      ` : ''}
      
      ${data.notes ? `
        <div class="payment-info">
          <div>Catatan: ${data.notes}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        ${receipt_footer}
      </div>
    </body>
    </html>
  `;
};
