import { forwardRef, type LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium ${className}`}
        {...props}
      >
        {children}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
    )
  },
)

Label.displayName = 'Label'
