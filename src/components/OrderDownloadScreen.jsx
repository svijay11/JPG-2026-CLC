import React, { useState } from 'react';
import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';
import { exportAllCartItemsToPdf, exportCartItemToPdf } from '../utils/exportOrderPdf';

export default function OrderDownloadScreen({
  orderItems,
  orderMeta = {},
  onDone
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadAll = async () => {
    setDownloading(true);
    setError(null);
    try {
      await exportAllCartItemsToPdf(orderItems, orderMeta);
      setDownloaded(true);
    } catch (err) {
      console.error(err);
      setError(err?.message ? `PDF error: ${err.message}` : 'Something went wrong generating your PDFs. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadOne = async (item, index) => {
    setDownloading(true);
    setError(null);
    try {
      await exportCartItemToPdf(item, index, orderMeta);
      setDownloaded(true);
    } catch (err) {
      console.error(err);
      setError(err?.message ? `PDF error: ${err.message}` : 'Something went wrong generating this PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-luxury-charcoal/95 backdrop-blur-sm flex items-center justify-center p-6 font-sansUI">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-serifHeading text-luxury-charcoal mb-2">
            Your Order Is Ready
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Payment skipped for now — download your Etsy-style order receipt with print-ready label art on page 2.
          </p>
        </div>

        <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto">
          {orderItems.map((item, index) => {
            const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
            const materialName = item.material
              ? (MATERIALS.find((m) => m.id === item.material)?.name || item.material)
              : 'Standard 4CP';
            const textPreview = item.textSegments
              ?.map((s) => s.text)
              .filter(Boolean)
              .join(' · ');

            return (
              <div key={index} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                <div className="w-16 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-luxury-charcoal truncate">{shapeName}</p>
                  <p className="text-[10px] text-gray-500 capitalize">{materialName}</p>
                  {textPreview && (
                    <p className="text-[10px] text-gray-400 italic truncate">&ldquo;{textPreview}&rdquo;</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{item.quantity} labels</p>
                </div>
                <button
                  type="button"
                  disabled={downloading}
                  onClick={() => handleDownloadOne(item, index)}
                  className="text-[10px] font-bold uppercase tracking-wider text-luxury-gold hover:underline disabled:opacity-50 flex-shrink-0"
                >
                  PDF
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-6 pt-2 space-y-3 border-t border-gray-100">
          {error && (
            <p className="text-xs text-red-600 text-center">{error}</p>
          )}
          {downloaded && !error && (
            <p className="text-xs text-green-600 text-center font-medium">Download started — check your downloads folder.</p>
          )}

          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadAll}
            className="w-full bg-luxury-gold text-luxury-charcoal hover:bg-luxury-gold/90 font-bold py-3.5 px-6 rounded-md tracking-wider uppercase transition-all shadow-md disabled:opacity-60"
          >
            {downloading ? 'Preparing PDF…' : 'Download Order PDF'}
          </button>

          <button
            type="button"
            onClick={onDone}
            className="w-full text-sm text-gray-500 hover:text-luxury-charcoal py-2 transition-colors"
          >
            Back to Designer
          </button>
        </div>
      </div>
    </div>
  );
}
