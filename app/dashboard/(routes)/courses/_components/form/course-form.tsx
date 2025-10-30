'use client';

import React from 'react';
import { Course } from '../../_data/schema';
import { Formik, FormikHelpers, Form, Field } from 'formik';
import { createCourse } from '../../action';
import { useCourseContext } from '../../_context/courses-context';
import { toast } from 'sonner';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Button } from '@/app/_components/ui/button';
import { reload } from '@/action/action';
import { useServerAction } from 'zsa-react';
import { Loader2 } from 'lucide-react';

// Define a form-specific type that doesn't require id, createdAt, updatedAt
type CourseFormValues = {
  id: string;
  title: string;
};

interface CourseFormProps {
  currentRow?: Course;
}

const CourseForm: React.FC<CourseFormProps> = ({ currentRow }) => {
  const isEdit = !!currentRow;
  const { execute } = useServerAction(createCourse);
  const { setOpen } = useCourseContext();
  const initialValues: CourseFormValues = {
    id: currentRow?.id || '',
    title: currentRow?.title || '',
  };

  const onSubmit = async (
    values: CourseFormValues,
    { setSubmitting }: FormikHelpers<CourseFormValues>
  ) => {
    // Your logic here, maybe adapt values if it's for editing
    setSubmitting(true);
    const [, err] = await execute({
      id: isEdit ? currentRow.id : undefined,
      title: values.title,
    });
    setOpen(null);
    if (err) {
      const dataErr = JSON.parse(err?.message);

      toast.error(`Something went wrong: ${dataErr[0]?.message}`, {
        position: 'top-right',
      });
    } else {
      toast.success('Course created succesfully', { position: 'top-right' });
      setTimeout(() => {
        reload(`/dashboard/courses`);
      }, 500);
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
            <Label>Course Title</Label>
            <Field as={Input} name="title" />
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

export default CourseForm;
