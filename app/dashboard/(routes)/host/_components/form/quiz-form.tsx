'use client';

import Spinner from '@/app/_components/ui/spinner';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import QuizTitleInput from './quiz-title-input';
import QuestionList from './question-list';
import QuizDatePicker from './quiz-date-picker';
import { Button } from '@/app/_components/ui/button';
import { useQuizForm } from '../../_hooks/use-quiz-form';
import { quizZodSchema } from '../../_validations/quiz-schema';
import QuizTimePicker from './quiz-time-picker';
import QuizDurationInput from './quiz-duration-input';

export const QuizForm = ({ submited }: { submited: boolean }) => {
  const { initialValues, handleSubmit, loading } = useQuizForm();

  const formik = useFormik({
    initialValues,
    validationSchema: toFormikValidationSchema(quizZodSchema),
    onSubmit: handleSubmit,
    enableReinitialize: true,
    validateOnMount: true,

  });

  if (loading) return <Spinner />;

  return (
    <FormikProvider value={formik} >
      <fieldset disabled={submited} className="space-y-6 opacity-100">
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <QuizTitleInput
            value={formik.values.quizTitle}
            onChange={formik.handleChange('quizTitle')}
            error={formik.errors.quizTitle}
          />

          <QuestionList
            questions={formik.values.questions}
            setFieldValue={formik.setFieldValue}
            errors={formik.errors.questions}
          />

          <QuizDatePicker
            value={formik.values.quizDate}
            onChange={(date) => formik.setFieldValue('quizDate', date)}
            error={formik.errors.quizDate as string}
          />

          <QuizTimePicker
            value={formik.values.quizTime}
            onChange={(time) => formik.setFieldValue('quizTime', time)}
          // error={}
          />

          <QuizDurationInput
            value={formik.values.quizDuration > 0 ? String(formik.values.quizDuration) : ""}
            onChange={formik.handleChange('quizDuration')}
          // error={formik.errors.quizDuration}
          />

          <Button type="submit" disabled={!formik.isValid || loading}>
            {loading ? 'Saving...' : 'Save Quiz'}
          </Button>
        </form>
      </fieldset>
    </FormikProvider>
  );
};
