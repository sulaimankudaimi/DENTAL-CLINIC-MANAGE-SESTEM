import React, { useState, useRef } from 'react';
import type { CreateProcedure, ProcedureCategory } from '@shared/contracts';
import { PROCEDURE_CATEGORIES } from '@shared/contracts';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (procedures: CreateProcedure[]) => Promise<number>;
  clinicId?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  clinicId = 'c1000000-0000-0000-0000-000000000001',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [parsedItems, setParsedItems] = useState<CreateProcedure[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const sampleCsvContent = `code,name_ar,name_en,category,price_sar,duration_min,requires_tooth,requires_surface,is_active
D2391,حشوة كمبوزيت سطح واحد خلفية,Resin composite 1-surf posterior,restorative,250,30,true,true,true
D3310,علاج عصب سن أمامي (جلسة كاملة),Endodontic therapy anterior,endodontics,750,45,true,false,true
D7140,خلع سن بسيط غير جراحي,Extraction erupted tooth,oral_surgery,200,20,true,false,true
D1110,تنظيف وتلميع أسنان للبالغين,Prophylaxis adult,preventive,180,30,false,false,true
D0150,فحص فموي شامل وتخطيط علاج,Comprehensive oral evaluation,diagnostic,120,20,false,false,true`;

  const downloadSampleTemplate = () => {
    const blob = new Blob(['\uFEFF' + sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'eyadati_procedures_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        parseCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const parseCsv = (raw: string) => {
    const lines = raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseErrors(['الملف فارغ أو لا يحتوي على صفوف بيانات بعد الترويسة']);
      setParsedItems([]);
      return;
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const codeIdx = header.findIndex((h) => h.includes('code') || h.includes('كود') || h.includes('رمز'));
    const nameArIdx = header.findIndex((h) => h.includes('name_ar') || h.includes('عرب'));
    const nameEnIdx = header.findIndex((h) => h.includes('name_en') || h.includes('إنجل') || h.includes('eng'));
    const catIdx = header.findIndex((h) => h.includes('category') || h.includes('فئة') || h.includes('تصنيف'));
    const priceIdx = header.findIndex((h) => h.includes('price') || h.includes('سعر'));
    const durIdx = header.findIndex((h) => h.includes('duration') || h.includes('مدة') || h.includes('وقت'));
    const toothIdx = header.findIndex((h) => h.includes('tooth') || h.includes('سن'));
    const surfIdx = header.findIndex((h) => h.includes('surface') || h.includes('سطح'));
    const activeIdx = header.findIndex((h) => h.includes('active') || h.includes('نشط') || h.includes('مفعل'));

    if (codeIdx === -1 || nameArIdx === -1) {
      setParseErrors(['يجب أن يحتوي ملف CSV على عمودين إلزاميين على الأقل: code و name_ar']);
      setParsedItems([]);
      return;
    }

    const items: CreateProcedure[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // simple comma splitting handling quotes
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ''));

      const code = cells[codeIdx]?.trim();
      const nameAr = cells[nameArIdx]?.trim();
      if (!code || !nameAr) {
        errors.push(`السطر ${i + 1}: تم تخطي سطر بدون رمز أو اسم`);
        continue;
      }

      let category: ProcedureCategory = 'restorative';
      const catVal = catIdx !== -1 ? cells[catIdx]?.toLowerCase() : '';
      if (PROCEDURE_CATEGORIES.includes(catVal as ProcedureCategory)) {
        category = catVal as ProcedureCategory;
      }

      const priceVal = priceIdx !== -1 ? parseFloat(cells[priceIdx]) || 150 : 150;
      const durVal = durIdx !== -1 ? parseInt(cells[durIdx], 10) || 30 : 30;
      const reqTooth = toothIdx !== -1 ? cells[toothIdx]?.toLowerCase() === 'true' || cells[toothIdx] === '1' : true;
      const reqSurf = surfIdx !== -1 ? cells[surfIdx]?.toLowerCase() === 'true' || cells[surfIdx] === '1' : false;
      const isActive = activeIdx !== -1 ? cells[activeIdx]?.toLowerCase() !== 'false' && cells[activeIdx] !== '0' : true;

      items.push({
        clinic_id: clinicId,
        category,
        code: code.toUpperCase(),
        name_ar: nameAr,
        name_en: (nameEnIdx !== -1 ? cells[nameEnIdx] : '') || nameAr,
        default_price_halalas: Math.round(priceVal * 100),
        default_duration_min: durVal,
        requires_tooth: reqTooth,
        requires_surface: reqSurf,
        color: '#1E4E9C',
        is_active: isActive,
      });
    }

    setParseErrors(errors);
    setParsedItems(items);
    if (items.length > 0) {
      setStep('preview');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);
    try {
      await onImport(parsedItems);
      onClose();
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : 'فشل استيراد البيانات']);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                استيراد إجراءات سريرية من ملف CSV
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديث واستيراد قائمة الأسعار والأكواد دفعة واحدة بصيغة CSV متوافقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {step === 'upload' ? (
            <div className="space-y-4">
              {/* Template Download Banner */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Download className="w-5 h-5 text-brand-navy" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">قالب ملف CSV النموذجي</h4>
                    <p className="text-[11px] text-slate-500">
                      يحتوي على الأعمدة القياسية وترميز UTF-8 لدعم النصوص العربية في Excel
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleTemplate}
                  className="text-xs shrink-0"
                >
                  تحميل القالب (.csv)
                </Button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition-all space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-blue-100 text-brand-navy mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">انقر لاختيار ملف CSV أو اسحبه هنا</p>
                  <p className="text-xs text-slate-500 mt-1">
                    يدعم ملفات CSV بحجم حتى 5 ميجابايت وترميز UTF-8
                  </p>
                </div>
              </div>

              {/* Or Paste CSV directly */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  أو الصق محتوى CSV مباشرة هنا:
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => {
                    setCsvText(e.target.value);
                    if (e.target.value.trim().length > 10) {
                      parseCsv(e.target.value);
                    }
                  }}
                  placeholder="code,name_ar,name_en,category,price_sar,duration_min..."
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none resize-none"
                  dir="ltr"
                />
              </div>

              {parseErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> تنبيهات التحقق:
                  </div>
                  {parseErrors.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    تم تجهيز {parsedItems.length} إجراء للاستيراد
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep('upload');
                    setParsedItems([]);
                  }}
                  className="text-xs"
                >
                  اختيار ملف آخر
                </Button>
              </div>

              <div className="overflow-x-auto max-h-[300px] border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5">الكود</th>
                      <th className="p-2.5">اسم الإجراء</th>
                      <th className="p-2.5">الفئة</th>
                      <th className="p-2.5 text-center">السعر</th>
                      <th className="p-2.5 text-center">المدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-brand-navy">{item.code}</td>
                        <td className="p-2.5 font-medium text-slate-900">{item.name_ar}</td>
                        <td className="p-2.5">
                          <Badge variant="outline" className="text-[10px]">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-center font-semibold">
                          {(item.default_price_halalas / 100).toLocaleString('en-US')} ر.س
                        </td>
                        <td className="p-2.5 text-center text-slate-600">
                          {item.default_duration_min} د
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
          <Button variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          {step === 'preview' && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmImport}
              disabled={isProcessing}
            >
              {isProcessing ? 'جاري الاستيراد...' : `تأكيد استيراد ${parsedItems.length} إجراء`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
