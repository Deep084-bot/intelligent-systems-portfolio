import { motion } from 'framer-motion';
import { TRANSITION } from '../constants';

// Fade In Animation
export const FadeIn = ({
  children,
  delay = 0,
  duration = 0.6,
  className,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In Animation (4 directions)
export const SlideIn = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  className,
  ...props
}) => {
  const getInitial = () => {
    const axes = {
      up: { y: distance, x: 0 },
      down: { y: -distance, x: 0 },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
    };
    return { opacity: 0, ...axes[direction] };
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Scale In Animation
export const ScaleIn = ({
  children,
  delay = 0,
  duration = 0.5,
  scale = 0.8,
  className,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, scale }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Container - for animating children sequentially
export const StaggerContainer = ({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className,
  ...props
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      visible: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: delay,
        },
      },
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger Item - use inside StaggerContainer
export const StaggerItem = ({
  children,
  direction = 'up',
  distance = 30,
  className,
  ...props
}) => {
  const getInitial = () => {
    const axes = {
      up: { y: distance, x: 0 },
      down: { y: -distance, x: 0 },
      left: { x: distance, y: 0 },
      right: { x: -distance, y: 0 },
    };
    return { opacity: 0, ...axes[direction] };
  };

  return (
    <motion.div
      variants={{
        hidden: getInitial(),
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.5, ease: 'easeOut' },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Hover Scale Animation
export const HoverScale = ({
  children,
  scale = 1.05,
  className,
  ...props
}) => (
  <motion.div
    whileHover={{ scale }}
    whileTap={{ scale: 0.98 }}
    transition={TRANSITION.smooth}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Floating Animation - continuous floating effect
export const FloatingAnimation = ({
  children,
  distance = 10,
  duration = 3,
  delay = 0,
  className,
  ...props
}) => (
  <motion.div
    animate={{ y: [0, -distance, 0] }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Pulse Animation
export const PulseAnimation = ({
  children,
  scale = 1.1,
  duration = 2,
  className,
  ...props
}) => (
  <motion.div
    animate={{ scale: [1, scale, 1] }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Number Counter Animation
export const CountUp = ({
  from = 0,
  to = 100,
  duration = 2,
  delay = 0,
  format = (n) => n.toFixed(0),
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
      {...props}
    >
      <motion.div
        initial={{ count: from }}
        animate={{ count: to }}
        transition={{ duration, delay, ease: 'easeOut' }}
        values={{ count: from }}
      >
        {(value) => <span>{format(value.count)}</span>}
      </motion.div>
    </motion.div>
  );
};

// Typewriter Animation
export const TypewriterAnimation = ({
  text,
  duration = 2,
  delay = 0,
  cursorBlink = true,
  className,
  ...props
}) => {
  const chars = text.split('');

  return (
    <motion.div className={className} {...props}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: duration / chars.length,
              delayChildren: delay,
            },
          },
        }}
        className="inline"
      >
        {chars.map((char, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            className="inline"
          >
            {char}
          </motion.span>
        ))}
      </motion.div>
      {cursorBlink && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block ml-1 w-0.5 h-em bg-accent-500"
        >
          |
        </motion.span>
      )}
    </motion.div>
  );
};

// Rotate Animation
export const RotateAnimation = ({
  children,
  duration = 4,
  reverse = false,
  className,
  ...props
}) => (
  <motion.div
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'linear',
    }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Gradient Shift Animation
export const GradientShift = ({
  children,
  duration = 4,
  className,
  ...props
}) => (
  <motion.div
    animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    style={{ backgroundSize: '200% 200%' }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Scroll Trigger Animation - animates when in viewport
export const ScrollTrigger = ({
  children,
  variant = 'fadeUp',
  delay = 0,
  once = true,
  className,
  ...props
}) => {
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    },
    fadeDown: {
      hidden: { opacity: 0, y: -30 },
      visible: { opacity: 1, y: 0 },
    },
    fadeLeft: {
      hidden: { opacity: 0, x: 30 },
      visible: { opacity: 1, x: 0 },
    },
    fadeRight: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0 },
    },
    scaleUp: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
      variants={variants[variant]}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Shimmer Loading Animation
export const Shimmer = ({
  width = '100%',
  height = '20px',
  className,
  ...props
}) => (
  <motion.div
    className={`bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 ${className}`}
    style={{
      width,
      height,
      backgroundSize: '200% 100%',
    }}
    animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    {...props}
  />
);

// Path Animation (for drawing SVG paths)
export const PathAnimation = ({
  children,
  duration = 2,
  delay = 0,
  className,
  ...props
}) => (
  <motion.svg
    className={className}
    {...props}
  >
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        duration,
        delay,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.g>
  </motion.svg>
);

// Blur In Animation
export const BlurIn = ({
  children,
  delay = 0,
  duration = 0.6,
  className,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, filter: 'blur(10px)' }}
    animate={{ opacity: 1, filter: 'blur(0px)' }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

// Tap Animation for interactive elements
export const TapAnimation = ({
  children,
  scale = 0.95,
  className,
  ...props
}) => (
  <motion.div
    whileTap={{ scale }}
    transition={TRANSITION.smooth}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);
