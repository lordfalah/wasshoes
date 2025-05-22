import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export default function ModalLayout({ children }: React.PropsWithChildren) {
  return (
    <AlertDialog defaultOpen={true}>
      <AlertDialogContent
        id="content-modal"
        aria-describedby="content-modal"
        className="!max-w-3xl overflow-hidden p-0"
      >
        {children}

        <AlertDialogDescription className="sr-only">
          Description
        </AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>
  );
}
