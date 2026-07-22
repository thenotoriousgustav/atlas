import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import { Button } from '@atlas/ui/components/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '@atlas/ui/components/select';
import { UploadSimple, FileText, CheckCircle, Table, ArrowRight } from '@phosphor-icons/react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: any[];
  onImportBulk: (transactions: any[], accountId: string) => Promise<void>;
}

export function CsvImportModal({
  isOpen,
  onClose,
  accounts = [],
  onImportBulk,
}: CsvImportModalProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [columnMapping, setColumnMapping] = useState({
    dateIndex: 0,
    titleIndex: 1,
    amountIndex: 2,
    typeIndex: 3,
  });

  const [parsedPreview, setParsedPreview] = useState<
    Array<{
      date: string;
      title: string;
      amount: number;
      type: 'INCOME' | 'EXPENSE';
    }>
  >([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const firstLine = lines[0];
      if (!firstLine) return;

      const headers = firstLine.split(',').map((h) => h.replace(/^"(.*)"$/, '$1').trim());
      const dataRows = lines.slice(1).map((line) =>
        line.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1').trim())
      );

      setCsvHeaders(headers);
      setCsvRows(dataRows);

      // Auto-detect header indices
      const dateIdx = headers.findIndex((h) => /date|tanggal/i.test(h));
      const titleIdx = headers.findIndex((h) => /title|description|payee|merchant/i.test(h));
      const amountIdx = headers.findIndex((h) => /amount|jumlah|nominal|cost/i.test(h));
      const typeIdx = headers.findIndex((h) => /type|jenis|direction/i.test(h));

      setColumnMapping({
        dateIndex: dateIdx !== -1 ? dateIdx : 0,
        titleIndex: titleIdx !== -1 ? titleIdx : 1,
        amountIndex: amountIdx !== -1 ? amountIdx : 2,
        typeIndex: typeIdx !== -1 ? typeIdx : 3,
      });

      setStep('map');
    };
    reader.readAsText(uploadedFile);
  };

  const generatePreview = () => {
    const parsed = csvRows.map((row) => {
      const rawDate = row[columnMapping.dateIndex] || new Date().toISOString().split('T')[0] || '';
      const title = row[columnMapping.titleIndex] || 'Imported Transaction';
      const rawAmount = row[columnMapping.amountIndex] || '0';
      const rawType = row[columnMapping.typeIndex] || 'EXPENSE';

      const amountNum = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]+/g, '')) || 0);
      const isIncome = /income|masuk|kredit|c/i.test(rawType) || parseFloat(rawAmount) > 0;

      return {
        date: rawDate,
        title,
        amount: amountNum,
        type: (isIncome ? 'INCOME' : 'EXPENSE') as 'INCOME' | 'EXPENSE',
      };
    });

    setParsedPreview(parsed);
    setStep('preview');
  };

  const handleFinishImport = async () => {
    if (!targetAccountId) return;
    setIsSubmitting(true);
    try {
      await onImportBulk(parsedPreview, targetAccountId);
      onClose();
      setStep('upload');
      setFile(null);
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl rounded-none border-[#EAEAEA] bg-white p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-sans text-sm font-semibold uppercase tracking-wider text-[#111111]">
            Import Transaksi dari CSV
          </DialogTitle>
          <DialogDescription className="text-xs text-[#787774]">
            Unggah berkas CSV mutasi bank atau e-wallet untuk impor transaksi massal.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload File */}
        {step === 'upload' && (
          <div className="mt-4 flex flex-col items-center justify-center rounded-none border border-dashed border-[#EAEAEA] bg-[#F7F6F3] p-8 text-center">
            <UploadSimple className="size-8 text-[#787774]" />
            <p className="mt-2 text-xs font-semibold text-[#111111]">
              Pilih file .CSV dari komputer Anda
            </p>
            <p className="text-[11px] text-[#787774]">
              Mendukung format standar CSV dengan kolom Tanggal, Deskripsi, & Nominal.
            </p>
            <label className="mt-4 cursor-pointer rounded-none bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-[#333333]">
              <span>Pilih Berkas CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Step 2: Mapping Columns */}
        {step === 'map' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-none border border-[#EAEAEA] bg-[#F7F6F3] p-3 text-xs">
              <FileText className="size-4 text-[#111111]" />
              <span className="font-medium text-[#111111]">File: {file?.name}</span>
              <span className="text-[#787774]">({csvRows.length} baris transaksi)</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#111111]">Target Account</label>
              <Select value={targetAccountId} onValueChange={setTargetAccountId}>
                <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                  <SelectValue placeholder="Pilih Target Account" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectGroup>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#EAEAEA] pt-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#111111]">Kolom Tanggal</label>
                <Select
                  value={columnMapping.dateIndex.toString()}
                  onValueChange={(val) =>
                    setColumnMapping({ ...columnMapping, dateIndex: parseInt(val) })
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      {csvHeaders.map((h, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {h} (Kolom {idx + 1})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#111111]">Kolom Judul/Merchant</label>
                <Select
                  value={columnMapping.titleIndex.toString()}
                  onValueChange={(val) =>
                    setColumnMapping({ ...columnMapping, titleIndex: parseInt(val) })
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      {csvHeaders.map((h, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {h} (Kolom {idx + 1})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#111111]">Kolom Nominal</label>
                <Select
                  value={columnMapping.amountIndex.toString()}
                  onValueChange={(val) =>
                    setColumnMapping({ ...columnMapping, amountIndex: parseInt(val) })
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      {csvHeaders.map((h, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {h} (Kolom {idx + 1})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#111111]">Kolom Tipe (Income/Expense)</label>
                <Select
                  value={columnMapping.typeIndex.toString()}
                  onValueChange={(val) =>
                    setColumnMapping({ ...columnMapping, typeIndex: parseInt(val) })
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-none border-[#EAEAEA] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectGroup>
                      {csvHeaders.map((h, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {h} (Kolom {idx + 1})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Preview Table */}
        {step === 'preview' && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111111]">
                Preview Hasil Parse ({parsedPreview.length} Transaksi)
              </span>
              <span className="text-[11px] text-[#787774]">
                Target: {accounts.find((a) => a.id === targetAccountId)?.name}
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-none border border-[#EAEAEA]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F7F6F3] text-[10px] uppercase text-[#787774]">
                  <tr>
                    <th className="p-2">Tanggal</th>
                    <th className="p-2">Transaksi</th>
                    <th className="p-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {parsedPreview.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono text-[11px] text-[#787774]">{row.date}</td>
                      <td className="p-2 font-medium text-[#111111]">{row.title}</td>
                      <td className="p-2 text-right font-mono font-bold">
                        <span className={row.type === 'INCOME' ? 'text-[#346538]' : 'text-[#111111]'}>
                          {row.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(row.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex items-center justify-between border-t border-[#EAEAEA] pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-8.5 rounded-none border-[#EAEAEA] text-xs text-[#787774]"
          >
            Batal
          </Button>

          {step === 'map' && (
            <Button
              type="button"
              onClick={generatePreview}
              className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              <span>Lanjut Preview</span>
              <ArrowRight className="size-3.5" />
            </Button>
          )}

          {step === 'preview' && (
            <Button
              type="button"
              onClick={handleFinishImport}
              disabled={isSubmitting}
              className="h-8.5 gap-1.5 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              <CheckCircle className="size-3.5" />
              <span>{isSubmitting ? 'Mengimpor...' : 'Impor Transaksi Sekarang'}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
