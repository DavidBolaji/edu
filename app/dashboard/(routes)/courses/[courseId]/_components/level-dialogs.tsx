'use client';

import { useLevelContext } from '../_context/level-context';
import LevelActionDialog from './level-action-dialogs';
import { LevelDeleteDialog } from './level-delete-dialog';

export function LevelDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useLevelContext();
  return (
    <>
      <LevelActionDialog
        key="level-add"
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />

      {currentRow && (
        <>
          <LevelActionDialog
            key={`level-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <LevelDeleteDialog
            key={`level-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete');
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
