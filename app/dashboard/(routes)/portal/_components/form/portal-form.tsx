'use client';

import React from 'react';
import { Portal } from '../table/schema';
import { Formik, FormikHelpers, Form, Field } from 'formik';
import { createPortal, updatePortalAction } from '../../action';
import { usePortaleContext } from '../../_context/portal-context';
import { toast } from 'sonner';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Button } from '@/app/_components/ui/button';
import { reload } from '@/action/action';
import { useServerAction } from 'zsa-react';
import { Loader2 } from 'lucide-react';
import QuizDatePicker from '../../../host/_components/form/quiz-date-picker';

// Define a form-specific type that doesn't require id, createdAt, updatedAt
type PortalFormValues = {
    id: string;
    desc: string;
    openDate: Date;
    closeDate: Date
};

interface PortalFormProps {
    currentRow?: Portal;
    onClose?: () => void;
}

const PortalForm: React.FC<PortalFormProps> = ({ currentRow, onClose }) => {
    const isEdit = !!currentRow;
    const { execute } = useServerAction(updatePortalAction);
    const { setOpen, onRefresh } = usePortaleContext();
    const initialValues: PortalFormValues = {
        id: currentRow?.id || '',
        desc: currentRow?.desc || '',
        openDate: currentRow?.openDate as unknown as Date,
        closeDate: currentRow?.closeDate as unknown as Date
    };

    const onSubmit = async (
        values: PortalFormValues,
        { setSubmitting }: FormikHelpers<PortalFormValues>
    ) => {
        // Your logic here, maybe adapt values if it's for editing
        setSubmitting(true);
        const [, err] = await execute({
            id: isEdit ? currentRow.id : undefined,
            desc: values.desc,
            openDate: values.openDate,
            closeDate: values.closeDate,
        });
        setOpen(null);
        onClose?.();
        if (err) {
            const dataErr = JSON.parse(err?.message);

            toast.error(`Something went wrong: ${dataErr[0]?.message}`, {
                position: 'top-right',
            });
        } else {
            toast.success('Portal updated successfully', { position: 'top-right' });
            // Refresh the portal list to show updated data
            onRefresh();
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
            {({ handleSubmit, isSubmitting, values, setFieldValue, errors }) => (
                <Form onSubmit={handleSubmit} className="space-y-3 p-1">
                    <div className="space-y-1">
                        <Label>Portal Description</Label>
                        <Field as={Input} name="desc" />
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

                    <Button type="submit" className="translate-y-3 px-4 py-2">
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

export default PortalForm;
