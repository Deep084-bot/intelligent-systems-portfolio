import { forwardRef } from 'react';
import { cn } from '../../utils';

// Button Component
export const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      className,
      children,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'btn-base inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-neutral-700 text-neutral-100 hover:bg-neutral-600 focus:ring-neutral-600',
      accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
      outline: 'border border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-600 focus:ring-neutral-600',
      ghost: 'text-neutral-100 hover:bg-neutral-800 hover:text-neutral-50 focus:ring-neutral-600',
      danger: 'bg-error text-white hover:bg-red-600 focus:ring-error',
    };

    const sizes = {
      xs: 'px-3 py-1 text-xs gap-1.5',
      sm: 'px-4 py-2 text-sm gap-2',
      md: 'px-6 py-2.5 text-base gap-2',
      lg: 'px-8 py-3 text-lg gap-2',
      xl: 'px-10 py-4 text-lg gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Card Component
export const Card = forwardRef(
  ({ className, children, hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-neutral-800 border border-neutral-700 rounded-lg p-6',
          hover && 'hover-lift hover:border-neutral-600',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Badge Component
export const Badge = ({ variant = 'primary', size = 'sm', className, children, ...props }) => {
  const variants = {
    primary: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
    accent: 'bg-accent-500/20 text-accent-300 border border-accent-500/30',
    success: 'bg-success/20 text-green-300 border border-success/30',
    warning: 'bg-warning/20 text-yellow-300 border border-warning/30',
    error: 'bg-error/20 text-red-300 border border-error/30',
    neutral: 'bg-neutral-700/50 text-neutral-300 border border-neutral-600/50',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

// Tag Component
export const Tag = ({ variant = 'neutral', size = 'sm', className, children, ...props }) => {
  const variants = {
    primary: 'bg-primary-500/20 text-primary-300',
    accent: 'bg-accent-500/20 text-accent-300',
    success: 'bg-success/20 text-green-300',
    neutral: 'bg-neutral-700 text-neutral-300',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={cn(
        'inline-block font-mono rounded-md',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Input Component
export const Input = forwardRef(
  ({ className, type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-2 text-neutral-300">{label}</label>}
        <input
          ref={ref}
          type={type}
          className={cn(
            'input-base',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
export const Textarea = forwardRef(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium mb-2 text-neutral-300">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            'input-base resize-none',
            error && 'border-error focus:ring-error',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Section Title Component
export const SectionTitle = ({
  title,
  subtitle,
  align = 'left',
  className,
  ...props
}) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={cn('space-y-2 sm:space-y-3 mb-8 sm:mb-12', alignClass[align], className)} {...props}>
      <h2 className="text-heading-2 font-bold text-neutral-50">
        {title}
      </h2>
      {subtitle && <p className="text-body-large text-neutral-400">{subtitle}</p>}
    </div>
  );
};

// Divider Component
export const Divider = ({ className, ...props }) => (
  <div className={cn('h-px bg-neutral-700/50', className)} {...props} />
);

// Glass Panel Component
export const GlassPanel = ({ className, children, ...props }) => (
  <div
    className={cn(
      'glass bg-neutral-900/50 backdrop-blur-md border border-neutral-700/30 rounded-lg p-6',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Terminal Block Component
export const TerminalBlock = ({ prompt = '$', className, children, ...props }) => (
  <div className={cn('terminal-container', className)} {...props}>
    <div className="flex gap-2">
      <span className="text-terminal-prompt">{prompt}</span>
      <span className="text-neutral-100">{children}</span>
    </div>
  </div>
);

// Code Block Component
export const CodeBlock = ({ language = 'bash', code, className, ...props }) => (
  <div className={cn('bg-neutral-900 rounded-lg overflow-hidden', className)} {...props}>
    <div className="bg-neutral-800 px-4 py-2 flex justify-between items-center border-b border-neutral-700">
      <span className="text-xs text-neutral-400 font-mono">{language}</span>
      <button className="text-xs text-neutral-400 hover:text-neutral-200 transition">Copy</button>
    </div>
    <pre className="p-4 text-sm overflow-auto">
      <code className="font-mono text-neutral-200">{code}</code>
    </pre>
  </div>
);

// Stat Card Component
export const StatCard = ({ label, value, icon: Icon, trend, className, ...props }) => (
  <Card className={cn('text-center', className)} {...props}>
    {Icon && <Icon className="w-6 h-6 mx-auto mb-3 text-accent-400" />}
    <p className="text-neutral-400 text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold text-neutral-50 mb-2">{value}</p>
    {trend && <p className="text-xs text-success">{trend}</p>}
  </Card>
);

// Progress Bar Component
export const ProgressBar = ({ label, value = 0, max = 100, showLabel = true, className, ...props }) => {
  const percentage = (value / max) * 100;

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-300">{label}</span>
          <span className="text-neutral-400 text-xs">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Skeleton Component
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      'bg-neutral-700 animate-pulse rounded-lg',
      className
    )}
    {...props}
  />
);

// Loading Spinner
export const Spinner = ({ size = 'md', className, ...props }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'inline-block rounded-full border-2 border-neutral-700 border-t-primary-500 animate-spin',
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

// Tooltip Component
export const Tooltip = ({ content, children, position = 'top', className, ...props }) => (
  <div className={cn('group relative inline-block', className)} {...props}>
    {children}
    <div className="opacity-0 group-hover:opacity-100 absolute bg-neutral-900 text-neutral-100 text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity duration-200 pointer-events-none z-tooltip">
      {content}
    </div>
  </div>
);

// Collapsible Component
export const Collapsible = ({ title, children, defaultOpen = false, className, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn('border border-neutral-700 rounded-lg', className)} {...props}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex justify-between items-center hover:bg-neutral-750 transition"
      >
        <span className="font-medium">{title}</span>
        <span className="text-neutral-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="px-4 py-3 border-t border-neutral-700">{children}</div>}
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ icon: Icon, title, description, action, className, ...props }) => (
  <div className={cn('text-center py-12 space-y-4', className)} {...props}>
    {Icon && <Icon className="w-12 h-12 mx-auto text-neutral-600" />}
    <h3 className="text-lg font-medium text-neutral-300">{title}</h3>
    {description && <p className="text-neutral-500 text-sm">{description}</p>}
    {action && <div className="pt-4">{action}</div>}
  </div>
);
