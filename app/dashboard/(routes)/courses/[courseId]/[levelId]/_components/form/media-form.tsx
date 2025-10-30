'use client';

import React from 'react';
import { Media } from '../../_data/schema';
import { Formik, FormikHelpers, Form, Field } from 'formik';
import { createMedia } from '../../action';
import { useMediaContext } from '../../_context/media-context';
import { toast } from 'sonner';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Button } from '@/app/_components/ui/button';
import { reload } from '@/action/action';
import { useServerAction } from 'zsa-react';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { SelectDropdown } from '@/app/_components/ui/select-dropdown';
import UploadMedia from './upload-media';

// Define a form-specific type that doesn't require id, createdAt, updatedAt
type MediaFormValues = {
  id: string;
  name: string;
  size: number;
  format: string;
  url: string;
  type: string;
};

interface MediaFormProps {
  currentRow?: Media;
}

const mediaType = [
  { label: 'Audio', value: 'AUDIO' },
  { label: 'Video', value: 'VIDEO' },
  { label: 'Ebook', value: 'EBOOK' },
];

const MediaForm: React.FC<MediaFormProps> = ({ currentRow }) => {
  const isEdit = !!currentRow;
  const { courseId, levelId } = useParams();
  const { execute } = useServerAction(createMedia);
  const { setOpen } = useMediaContext();
  const initialValues: MediaFormValues = {
    id: currentRow?.id || '',
    name: currentRow?.name || '',
    size: currentRow?.size || 0,
    format: currentRow?.format || '',
    url: currentRow?.url || '',
    type: currentRow?.type || '',
  };

  const onSubmit = async (
    values: MediaFormValues,
    { setSubmitting }: FormikHelpers<MediaFormValues>
  ) => {
    // Your logic here, maybe adapt values if it's for editing
    setSubmitting(true);
    const [, err] = await execute({
      id: isEdit ? currentRow.id : undefined,
      name: values.name,
      courseId: courseId as string,
      levelId: levelId as string,
      type: values.type || '',
      url: values.url,
      size: values.size,
      format: values.format,
    });
    setOpen(null);
    if (err) {
      const dataErr = JSON.parse(err?.message);

      toast.error(`Something went wrong: ${dataErr[0]?.message}`, {
        position: 'top-right',
      });
    } else {
      toast.success('Media created succesfully', { position: 'top-right' });
      setTimeout(() => {
        reload(`/dashboard/courses/${courseId}/${levelId}`);
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
      {({ handleSubmit, isSubmitting, values }) => (
        <Form onSubmit={handleSubmit} className="space-y-3 p-1">
          <div className="space-y-1">
            <Label>Name</Label>
            <Field as={Input} name="name" />
          </div>

          <div className="space-y-1">
            <Label>Type</Label>
            <Field
              as={SelectDropdown}
              name="type"
              defaultValue={values.type}
              placeholder="Select Media Type"
              items={mediaType}
            />
          </div>
          {values.type ? (
            <Field
              as={UploadMedia}
              name="url"
              fields={['size', 'format']}
              type={values.type}
              disabled={isSubmitting}
              margin="mb-2"
            />
          ) : null}

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

export default MediaForm;
