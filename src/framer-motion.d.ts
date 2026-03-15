import "framer-motion";

// Augment framer-motion to accept animation props on motion components (v12 compat)
declare module "framer-motion" {
  interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    whileInView?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileDrag?: any;
    viewport?: any;
    transition?: any;
    variants?: any;
  }
}
