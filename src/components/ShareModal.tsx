import { useState, useCallback } from 'react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  message: string;
  onClose: () => void;
}

export function ShareModal({ message, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [tryWhatsapp, setTryWhatsapp] = useState(false);

  // ── نسخ النص للحافظة
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback قديم
      const ta = document.createElement('textarea');
      ta.value = message;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [message]);

  // ── محاولة فتح واتساب مباشرة (بدون api.whatsapp)
  const handleOpenWhatsapp = useCallback(() => {
    const encoded = encodeURIComponent(message);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // على الموبايل: افتح تطبيق واتساب مباشرة
      window.location.href = `whatsapp://send?text=${encoded}`;
    } else {
      // على الديسك توب: web.whatsapp
      window.open(`https://web.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
    }
    setTryWhatsapp(true);
  }, [message]);

  // ── مشاركة عبر Web Share API (إن كان مدعوم)
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'قسّمها - تقسيم الفواتير',
          text: message,
        });
      } catch {
        // المستخدم أغلق
      }
    }
  }, [message]);

  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Sheet */}
      <div className="relative bg-white dark:bg-[#1a1a2e] rounded-t-3xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
            مشاركة الحساب
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="mx-5 mb-4">
          <div className="bg-gray-50 dark:bg-[#0f0f1a] rounded-3xl p-4 border border-gray-200 dark:border-[#2d2d4a] max-h-52 overflow-y-auto">
            <pre
              className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-5"
              dir="rtl"
            >
              {message}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 space-y-3">

          {/* ① نسخ النص - دائماً يشتغل */}
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-base transition-all ${
              copied
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>✅ تم النسخ! الصق في واتساب</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>نسخ النص ← ثم الصقه في واتساب</span>
              </>
            )}
          </button>

          {/* ② Web Share API (موبايل فقط) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-base bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:-translate-y-0.5 transition-all"
            >
              <Share2 className="w-5 h-5" />
              <span>مشاركة عبر التطبيقات (واتساب، تيليجرام...)</span>
            </button>
          )}

          {/* ③ فتح واتساب مباشرة */}
          <button
            onClick={handleOpenWhatsapp}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-3xl font-black text-base bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-lg shadow-[#25D366]/30 hover:-translate-y-0.5 transition-all"
          >
            {/* WhatsApp icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>فتح واتساب مباشرة</span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>

          {/* تلميح بعد محاولة الفتح */}
          {tryWhatsapp && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl px-4 py-3 flex items-start gap-2.5 animate-slide-up">
              <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-5">
                لو ما فتح واتساب تلقائياً،{' '}
                <button onClick={handleCopy} className="underline font-black">
                  انسخ النص
                </button>{' '}
                وافتح واتساب يدوياً ثم الصقه
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
