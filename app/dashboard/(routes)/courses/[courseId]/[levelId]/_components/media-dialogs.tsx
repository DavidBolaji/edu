'use client';

import { useMediaContext } from '../_context/media-context';
import MediaActionDialog from './media-action-dialogs';
import { MediaDeleteDialog } from './media-delete-dialog';

export function MediaDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useMediaContext();
  return (
    <>
      <MediaActionDialog
        key="level-add"
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />

      {currentRow && (
        <>
          <MediaActionDialog
            key={`level-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow as unknown as any}
          />

          <MediaDeleteDialog
            key={`level-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow as unknown as any}
          />
        </>
      )}
    </>
  );
}
