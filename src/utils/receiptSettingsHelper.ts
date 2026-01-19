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

/**
 * Helper function to extract receipt settings from the settings map
 * This normalizes the settings format whether they come from database or are hardcoded
 */
export const extractReceiptSettings = (settingsMap: Record<string, any> | null | undefined): ReceiptSettings => {
  if (!settingsMap) {
    return {
      store_name: 'Nama Toko',
      store_address: 'Alamat Toko',
      store_phone: 'No. Telepon',
      receipt_header: '',
      receipt_footer: 'Terima kasih atas kunjungan Anda!',
      paper_size: '80mm',
      show_cashier: true,
      show_logo: false,
      show_qr: false,
    };
  }

  // Extract store info - handle both nested and flat formats
  const getStoreName = (): string => {
    if (typeof settingsMap.store_name === 'object' && settingsMap.store_name?.name) {
      return settingsMap.store_name.name;
    }
    return settingsMap.store_name || 'Nama Toko';
  };

  const getStoreAddress = (): string => {
    if (typeof settingsMap.store_address === 'object' && settingsMap.store_address?.address) {
      return settingsMap.store_address.address;
    }
    return settingsMap.store_address || 'Alamat Toko';
  };

  const getStorePhone = (): string => {
    if (typeof settingsMap.store_phone === 'object' && settingsMap.store_phone?.phone) {
      return settingsMap.store_phone.phone;
    }
    return settingsMap.store_phone || 'No. Telepon';
  };

  const getStoreEmail = (): string => {
    if (typeof settingsMap.store_email === 'object' && settingsMap.store_email?.email) {
      return settingsMap.store_email.email;
    }
    return settingsMap.store_email || '';
  };

  // Extract receipt settings - handle nested format from receipt_settings key
  const receiptSettings = settingsMap.receipt_settings || {};

  const getReceiptHeader = (): string => {
    if (receiptSettings.header_text) return receiptSettings.header_text;
    if (settingsMap.receipt_header) return settingsMap.receipt_header;
    return '';
  };

  const getReceiptFooter = (): string => {
    if (receiptSettings.footer_text) return receiptSettings.footer_text;
    if (settingsMap.receipt_footer) return settingsMap.receipt_footer;
    return 'Terima kasih atas kunjungan Anda!';
  };

  const getPaperSize = (): '80mm' | '58mm' => {
    if (receiptSettings.paper_size) return receiptSettings.paper_size as '80mm' | '58mm';
    if (settingsMap.paper_size) return settingsMap.paper_size as '80mm' | '58mm';
    return '80mm';
  };

  const getShowCashier = (): boolean => {
    if (typeof receiptSettings.show_cashier === 'boolean') return receiptSettings.show_cashier;
    if (typeof settingsMap.show_cashier === 'boolean') return settingsMap.show_cashier;
    return true;
  };

  const getShowLogo = (): boolean => {
    if (typeof receiptSettings.show_logo === 'boolean') return receiptSettings.show_logo;
    if (typeof settingsMap.show_logo === 'boolean') return settingsMap.show_logo;
    return false;
  };

  const getShowQr = (): boolean => {
    if (typeof receiptSettings.show_qr_code === 'boolean') return receiptSettings.show_qr_code;
    if (typeof settingsMap.show_qr === 'boolean') return settingsMap.show_qr;
    return false;
  };

  return {
    store_name: getStoreName(),
    store_address: getStoreAddress(),
    store_phone: getStorePhone(),
    store_email: getStoreEmail(),
    receipt_header: getReceiptHeader(),
    receipt_footer: getReceiptFooter(),
    paper_size: getPaperSize(),
    show_cashier: getShowCashier(),
    show_logo: getShowLogo(),
    show_qr: getShowQr(),
  };
};
