'use client';

import { usePortaleContext } from '../_context/portal-context';
import PortalActionDialog from './portal-action-dialogs';
import { PortalsDeleteDialog } from './portal-delete-dialog';

export function PortalsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePortaleContext();
  return (
    <>
      {/* <PortalActionDialog
        key="Portal-add"
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      /> */}

      {currentRow && (
        <>
          <PortalActionDialog
            key={`portal-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen(null);
              setCurrentRow(null);
            }}
            currentRow={currentRow}
          />

          <PortalsDeleteDialog
            key={`Portal-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen(null);
              setCurrentRow(null);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
