'use client';

import { Formik, Field, FormikHelpers } from 'formik';

import { PortalFormValues } from '../types';
import { UserDetail } from '@/src/entities/models/user';
import { Label } from '@/app/_components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { portalZodSchema } from '../_validations/portal-schema';
import QuizDatePicker from '../../host/_components/form/quiz-date-picker';

interface PortalFormProps {
  onSubmit: (
    values: PortalFormValues,
    formikHelpers: FormikHelpers<PortalFormValues>
  ) => Promise<void>;
  user: UserDetail;
}

export const PortalForm: React.FC<PortalFormProps> = ({ onSubmit, user }) => {
  const courseList =
    user?.courses?.map((course) => ({
      label: course.title,
      value: course.title,
    })) ?? [];

  return (
    <Formik
      initialValues={{
        course: '',
        type: '',
        desc: '',
        level: '',
        openDate: new Date(),
        closeDate: new Date(),
      }}
      validationSchema={toFormikValidationSchema(portalZodSchema)}
      onSubmit={onSubmit}
      validateOnMount
    >
      {({
        setFieldValue,
        handleSubmit,
        values,
        isValid,
        isSubmitting,
        errors,
      }) => (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-xl"
        >
          <div>
            <Label htmlFor="desc" className="text-black mb-2 inline-block">
              Description
            </Label>
            <Field name="desc">
              {({ field }: { field: any }) => (
                <Input
                  {...field}
                  placeholder="Description"
                  className="text-black border placeholder:text-black bg-transparent border-gray-400 shadow-none"
                />
              )}
            </Field>
          </div>

          <div>
            <Label htmlFor="course" className="text-black inline-block mb-2">
              Choose Your Course
            </Label>
            <Select
              onValueChange={(value) => setFieldValue('course', value)}
              value={values.course}
            >
              <SelectTrigger className="text-black bg-transparent border-gray-400">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courseList.map((course) => (
                  <SelectItem key={course.value} value={course.value}>
                    {course.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type" className="text-black inline-block mb-2">
              Media Type
            </Label>
            <Select
              onValueChange={(value) => setFieldValue('type', value)}
              value={values.type}
            >
              <SelectTrigger className="text-black bg-transparent border-gray-400">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {['AUDIO', 'VIDEO', 'EBOOK'].map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {values.course && (
            <>
              <div>
                <Label htmlFor="level" className="text-black inline-block mb-2">
                  Level
                </Label>
                <Select
                  onValueChange={(value) => setFieldValue('level', value)}
                  value={values.level}
                >
                  <SelectTrigger className="text-black bg-transparent border-gray-400">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.courses
                      ?.find((course) => course.title === values.course)
                      ?.levels.map((level) => (
                        <SelectItem key={level.name} value={level.name}>
                          {level.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="openDate" className="text-black inline-block mb-2">
                  Open Date
                </Label>
                <QuizDatePicker
                  value={values.openDate}
                  onChange={(date) => setFieldValue('openDate', date)}
                  error={errors.openDate as string}
                />
              </div>

              <div>
                <Label htmlFor="closeDate" className="text-black inline-block mb-2">
                  Close Date
                </Label>
                <QuizDatePicker
                  value={values.closeDate}
                  onChange={(date) => setFieldValue('closeDate', date)}
                  error={errors.closeDate as string}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full mt-6"
          >
            Create Portal
          </Button>
        </form>
      )}
    </Formik>
  );
};
