import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';
import { NAVBAR_HEIGHT, Z_INDEX } from '../../constants';

export const Navbar = ({ className, onNavigate, ...props }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '#hero' },
    { label: 'Terminal', href: '#terminal' },
    { label: 'Education', href: '#education' },
    { label: 'Telemetry', href: '#leetcode' },
    { label: 'Projects', href: '#projects' },
    { label: 'AI', href: '#ai-assistant' },
    { label: 'DeepVerse', href: '/deepverse' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (href) => {
    setIsMenuOpen(false);
    if (href.startsWith('/')) {
      if (onNavigate) onNavigate(href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-800/50 z-navbar',
        className
      )}
      style={{ height: NAVBAR_HEIGHT }}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('#hero');
          }}
          className="font-bold text-lg text-gradient hover:opacity-80 transition"
        >
          dev.
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="text-neutral-400 hover:text-neutral-100 text-sm font-medium transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-medium hover:bg-accent-600 transition">
          Get in Touch →
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-neutral-400 hover:text-neutral-100 transition"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-full left-0 right-0 bg-neutral-800/95 backdrop-blur-lg border-b border-neutral-700 p-4"
        >
          <div className="space-y-3">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="block w-full text-left px-4 py-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700 rounded transition"
              >
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

// Main Layout Container
export const LayoutContainer = ({ children, className, ...props }) => {
  return (
    <div
      className={cn('min-h-screen bg-neutral-900', className)}
      style={{ paddingTop: NAVBAR_HEIGHT }}
      {...props}
    >
      {children}
    </div>
  );
};

// Section Container
export const Section = ({
  id,
  children,
  className,
  container = true,
  padding = true,
  ...props
}) => (
  <section
    id={id}
    className={cn(
      'w-full',
      padding && 'py-12 sm:py-16 md:py-20 lg:py-24',
      className
    )}
    {...props}
  >
    {container ? (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {children}
      </div>
    ) : (
      children
    )}
  </section>
);

// Page Container
export const PageContainer = ({ children, className, ...props }) => (
  <div
    className={cn(
      'w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Grid Container
export const Grid = ({
  children,
  cols = 3,
  gap = 4,
  className,
  responsive = true,
  ...props
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={cn(
        'grid',
        responsive ? colClasses[cols] : `grid-cols-${cols}`,
        gapClasses[gap] || 'gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Flex Container
export const Flex = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  gap = 4,
  wrap = false,
  className,
  ...props
}) => {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        justifyClasses[justify],
        alignClasses[align],
        gapClasses[gap] || 'gap-4',
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Stack Container (vertical flex with consistent spacing)
export const Stack = ({
  children,
  gap = 4,
  align = 'start',
  className,
  ...props
}) => (
  <Flex
    direction="col"
    align={align}
    gap={gap}
    className={className}
    {...props}
  >
    {children}
  </Flex>
);

// Center Container
export const Center = ({ children, className, ...props }) => (
  <div
    className={cn('flex items-center justify-center', className)}
    {...props}
  >
    {children}
  </div>
);

// Container with max width
export const MaxWidthContainer = ({
  children,
  maxWidth = 'max-w-7xl',
  centered = true,
  padding = true,
  className,
  ...props
}) => (
  <div
    className={cn(
      maxWidth,
      centered && 'mx-auto',
      padding && 'px-4 sm:px-6 md:px-8',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

// Spacer Component
export const Spacer = ({ height = 4, className, ...props }) => {
  const heightClasses = {
    2: 'h-2',
    3: 'h-3',
    4: 'h-4',
    6: 'h-6',
    8: 'h-8',
    12: 'h-12',
    16: 'h-16',
    20: 'h-20',
    24: 'h-24',
  };

  return <div className={cn(heightClasses[height] || 'h-4', className)} {...props} />;
};

// Box Component
export const Box = ({
  children,
  as = 'div',
  className,
  ...props
}) => {
  const Component = as;
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
};
