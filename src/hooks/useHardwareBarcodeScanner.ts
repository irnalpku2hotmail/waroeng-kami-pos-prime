import { useEffect, useRef } from 'react';

/**
 * Detects USB/Bluetooth keyboard-wedge barcode scanners by keystroke timing.
 * Human typing (slow, short) is ignored; a fast burst of >= MIN_LENGTH chars
 * is treated as one scan. Enter/Tab suffix is optional and swallowed.
 */
const MAX_INTERVAL_MS = 35;   // max gap between scanner keystrokes
const IDLE_FINISH_MS = 60;    // burst considered complete after this idle time
const MIN_LENGTH = 4;
const SUFFIX_GRACE_MS = 150;  // swallow Enter/Tab arriving right after a burst

interface Options {
  enabled: boolean;
  onScan: (barcode: string) => void;
  /** Inputs where scanning is allowed (e.g. the product search box). */
  allowedInputRef?: React.RefObject<HTMLInputElement>;
  /** Called to strip scanned chars that leaked into the allowed input. */
  onRestoreInput?: (valueBefore: string) => void;
}

export const normalizeBarcode = (raw: string) =>
  raw.replace(/[\u0000-\u001F\u007F]/g, '').trim();

export const useHardwareBarcodeScanner = ({ enabled, onScan, allowedInputRef, onRestoreInput }: Options) => {
  const onScanRef = useRef(onScan);
  const restoreRef = useRef(onRestoreInput);
  onScanRef.current = onScan;
  restoreRef.current = onRestoreInput;

  useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let lastTime = 0;
    let allFast = true;
    let inputValueBefore: string | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastFinishedAt = 0;

    const reset = () => {
      buffer = '';
      allFast = true;
      inputValueBefore = null;
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const finish = () => {
      const code = normalizeBarcode(buffer);
      const wasScan = allFast && code.length >= MIN_LENGTH;
      const before = inputValueBefore;
      reset();
      if (!wasScan) return false;
      lastFinishedAt = Date.now();
      if (before !== null) restoreRef.current?.(before);
      onScanRef.current(code);
      return true;
    };

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      const isField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
      const isAllowedInput = !!allowedInputRef?.current && target === allowedInputRef.current;
      if (isField && !isAllowedInput) return; // never intercept qty/payment/customer/modal inputs
      if (document.querySelector('[role="dialog"], [role="alertdialog"]') && !isAllowedInput) return;

      const now = Date.now();

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (buffer && allFast && normalizeBarcode(buffer).length >= MIN_LENGTH) {
          e.preventDefault();
          finish();
        } else if (now - lastFinishedAt < SUFFIX_GRACE_MS) {
          e.preventDefault(); // suffix after idle-finished burst: ignore
        }
        return;
      }

      if (e.key.length !== 1) return;

      if (buffer && now - lastTime > MAX_INTERVAL_MS) {
        // gap too long: previous chars were manual typing; start fresh
        reset();
      }
      if (!buffer) {
        inputValueBefore = isAllowedInput ? allowedInputRef!.current!.value : null;
      } else if (now - lastTime > MAX_INTERVAL_MS) {
        allFast = false;
      }
      // Fast follow-up char in the search box = scanner burst: keep it out of the input
      if (isAllowedInput && buffer && allFast) e.preventDefault();
      buffer += e.key;
      lastTime = now;
      if (timer) clearTimeout(timer);
      timer = setTimeout(finish, IDLE_FINISH_MS);
    };

    window.addEventListener('keydown', handler, true);
    return () => {
      window.removeEventListener('keydown', handler, true);
      reset();
    };
  }, [enabled, allowedInputRef]);
};
