import { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="field-set" className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function FieldLegend({ className, variant = 'legend', ...props }: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return <legend data-slot="field-legend" data-variant={variant} className={cn('mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base', className)} {...props} />;
}

export function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-group" className={cn('group/field-group @container/field-group flex w-full flex-col gap-5', className)} {...props} />;
}

const fieldVariants = cva('group/field flex w-full gap-2 data-[invalid=true]:text-destructive', {
  variants: {
    orientation: {
      vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
      horizontal: 'flex-row items-center has-[>[data-slot=field-content]]:items-start',
      responsive: 'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center',
    },
  },
  defaultVariants: { orientation: 'vertical' },
});

export function Field({ className, orientation = 'vertical', ...props }: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />;
}

export function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-content" className={cn('group/field-content flex flex-1 flex-col gap-0.5 leading-snug', className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" className={cn('group/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50', className)} {...props} />;
}

export function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="field-label" className={cn('flex w-fit items-center gap-2 text-sm font-medium', className)} {...props} />;
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="field-description" className={cn('text-left text-sm leading-normal font-normal text-muted-foreground', className)} {...props} />;
}

export function FieldSeparator({ children, className, ...props }: React.ComponentProps<'div'> & { children?: React.ReactNode }) {
  return (
    <div data-slot="field-separator" data-content={Boolean(children)} className={cn('relative -my-2 h-5 text-sm', className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children && <span className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground">{children}</span>}
    </div>
  );
}

export function FieldError({ className, children, errors, ...props }: React.ComponentProps<'div'> & { errors?: Array<{ message?: string } | undefined> }) {
  const content = useMemo(() => {
    if (children) return children;
    const unique = [...new Map((errors ?? []).map((error) => [error?.message, error])).values()];
    if (unique.length === 1) return unique[0]?.message;
    return unique.length > 1 ? <ul className="ml-4 flex list-disc flex-col gap-1">{unique.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}</ul> : null;
  }, [children, errors]);

  if (!content) return null;
  return <div role="alert" data-slot="field-error" className={cn('text-sm font-normal text-destructive', className)} {...props}>{content}</div>;
}
