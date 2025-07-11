"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentProps, PDFDownloadLink } from "@react-pdf/renderer";
import { FileText, Loader2 } from "lucide-react";
import type { ReactElement } from "react";

export default function PrintTablePdf({
  document,
  trigger,
  fileName = "laporan-order.pdf",
  className,
}: {
  document: ReactElement<DocumentProps>;
  trigger?: React.ReactNode; // ✅ Opsional: tombol kustom
  fileName?: string;
  className?: string;
}) {
  return (
    <PDFDownloadLink
      key={Date.now()}
      document={document}
      fileName={fileName}
      className={cn(className)}
    >
      {({ loading }) =>
        loading ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center justify-between"
            disabled={true}
          >
            <Loader2 className="animate-spin" />
            Please wait
          </Button>
        ) : (
          trigger || (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center justify-between"
            >
              <FileText />
              Print PDF
            </Button>
          )
        )
      }
    </PDFDownloadLink>
  );
}
