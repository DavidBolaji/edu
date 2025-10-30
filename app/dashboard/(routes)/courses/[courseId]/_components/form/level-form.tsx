'use client';

import React from 'react';
import { Level } from '../../_data/schema';
import { Formik, FormikHelpers, Form, Field } from 'formik';
import { createLevel } from '../../action';
import { useLevelContext } from '../../_context/level-context';
import { toast } from 'sonner';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Button } from '@/app/_components/ui/button';
import { reload } from '@/action/action';
import { useServerAction } from 'zsa-react';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

// Define a form-specific type that doesn't require id, createdAt, updatedAt
type LevelFormValues = {
  id: string;
  name: string;
};

interface LevelFormProps {
  currentRow?: Level;
}

const LevelForm: React.FC<LevelFormProps> = ({ currentRow }) => {
  const isEdit = !!currentRow;
  const { courseId } = useParams();
  const { execute } = useServerAction(createLevel);
  const { setOpen } = useLevelContext();
  const initialValues: LevelFormValues = {
    id: currentRow?.id || '',
    name: currentRow?.name || '',
  };

  const onSubmit = async (
    values: LevelFormValues,
    { setSubmitting }: FormikHelpers<LevelFormValues>
  ) => {
    // Your logic here, maybe adapt values if it's for editing
    setSubmitting(true);
    const [, err] = await execute({
      id: isEdit ? currentRow.id : undefined,
      name: values.name,
      courseId: courseId as string,
    });
    setOpen(null);
    if (err) {
      const dataErr = JSON.parse(err?.message);

      toast.error(`Something went wrong: ${dataErr[0]?.message}`, {
        position: 'top-right',
      });
    } else {
      toast.success('Level created succesfully', { position: 'top-right' });
      setTimeout(() => {
        reload(`/dashboard/courses/${courseId}`);
      }, 1500);
    }
    setSubmitting(false);
  };

  return (
    <Formik
      enableReinitialize
      key={initialValues?.id || 0}
      onSubmit={onSubmit}
      initialValues={initialValues}
    >
      {({ handleSubmit, isSubmitting }) => (
        <Form onSubmit={handleSubmit} className="space-y-3 p-1">
          <div className="space-y-1">
            <Label>Level Title</Label>
            <Field as={Input} name="name" />
          </div>

          <Button type="submit" className="translate-y-3">
            {isSubmitting ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              'Save changes'
            )}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default LevelForm;
