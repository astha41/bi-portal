// animations.js

// 🔥 Page Fade + Slide
export const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// 🔥 Fade In (simple)
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

// 🔥 Slide from left
export const slideInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 }
  }
};

// 🔥 Slide from right
export const slideInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6 }
  }
};

// 🔥 Zoom In
export const zoomIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

// 🔥 Bounce Entry (cool effect)
export const bounceIn = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 8
    }
  }
};

// 🔥 Stagger container (children animation delay)
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2
    }
  }
};

// 🔥 Hover Effects (buttons/cards)
export const scaleHover = {
  whileHover: {
    scale: 1.06,
    boxShadow: "0px 10px 25px rgba(0,0,0,0.2)"
  },
  whileTap: { scale: 0.96 }
};

// 🔥 Glow Hover (premium feel)
export const glowHover = {
  whileHover: {
    scale: 1.05,
    boxShadow: "0px 0px 20px rgba(255,255,255,0.6)"
  }
};

// 🔥 Rotate on hover (fun UI)
export const rotateHover = {
  whileHover: { rotate: 3, scale: 1.05 }
};

// 🔥 Floating animation (for icons/cards)
export const floating = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// 🔥 Pulse animation (attention grab)
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity
    }
  }
};

// 🔥 Page transition (route change)
export const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.5 }
};

// 🔥 Slide page (alternative transition)
export const slidePage = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { duration: 0.5 }
};

// 🔥 Loading shimmer (skeleton animation helper)
export const shimmer = {
  animate: {
    backgroundPosition: ["-200% 0", "200% 0"]
  },
  transition: {
    duration: 1.5,
    repeat: Infinity
  }
};