import React from 'react';
import { FormProvider, UseFormReturn } from 'react-hook-form';

interface FormProps {
  form: UseFormReturn<unknown>;
  onSubmit: (values: unknown) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export default function Form({
  form,
  onSubmit,
  children,
  className = "",
}: FormProps) {
  return (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        aria-busy={form.formState.isSubmitting} 
        className={className}
      >
        {children}
      </form>
    </FormProvider>
  );
}
