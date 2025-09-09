import '@testing-library/jest-dom'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    return <a {...props}>{children}</a>
  },
}))

// Mock framer-motion for testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div data-motion="true" {...props}>{children}</div>,
    button: ({ children, ...props }) => <button data-motion="true" {...props}>{children}</button>,
    article: ({ children, ...props }) => <article data-motion="true" {...props}>{children}</article>,
    section: ({ children, ...props }) => <section data-motion="true" {...props}>{children}</section>,
  },
  useReducedMotion: () => false,
  AnimatePresence: ({ children }) => children,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  CheckSquare: (props) => <div data-icon="CheckSquare" data-testid="step-icon" {...props} />,
  Layout: (props) => <div data-icon="Layout" data-testid="step-icon" {...props} />,
  Download: (props) => <div data-icon="Download" data-testid="step-icon" {...props} />,
  Heart: (props) => <div data-icon="Heart" data-testid="heart-icon" {...props} />,
  Menu: (props) => <div data-icon="Menu" data-testid="menu-icon" {...props} />,
  X: (props) => <div data-icon="X" data-testid="close-icon" {...props} />,
}))

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ borderBoxSize: [{ inlineSize: 0, blockSize: 0 }] }]);
  }
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver for scroll animations
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  unobserve() {}
  disconnect() {}
}

// Mock matchMedia for reduced motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})