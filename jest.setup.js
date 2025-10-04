import '@testing-library/jest-dom'

// Mock lucide-react
jest.mock('lucide-react', () => ({
  DollarSign: () => <div data-testid="dollar-sign" />,
  BookCheck: () => <div data-testid="book-check" />,
  Calculator: () => <div data-testid="calculator" />,
  FilePieChart: () => <div data-testid="file-pie-chart" />,
  CheckCircle: () => <div data-testid="check-circle" />,
  Settings: () => <div data-testid="settings" />,
  LogOut: () => <div data-testid="log-out" />,
  BriefcaseBusiness: () => <div data-testid="briefcase-business" />,
  Star: () => <div data-testid="star" />,
  FileText: () => <div data-testid="file-text" />,
  Filter: () => <div data-testid="filter" />,
  Target: () => <div data-testid="target" />,
  Award: () => <div data-testid="award" />,
  Zap: () => <div data-testid="zap" />,
  Download: () => <div data-testid="download" />,
  BarChart3: () => <div data-testid="bar-chart-3" />,
  TrendingUp: () => <div data-testid="trending-up" />,
  TrendingDown: () => <div data-testid="trending-down" />,
  Users: () => <div data-testid="users" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
  Trash2: () => <div data-testid="trash-2" />,
  Check: () => <div data-testid="check" />,
  CheckCheck: () => <div data-testid="check-check" />,
  Search: () => <div data-testid="search" />,
  // Add more icons as needed
}));

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Bar: () => <div data-testid="bar" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn(() => '2024-01-01'),
  formatDistanceToNow: jest.fn(() => '2 days ago'),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/dashboard'
  },
  useParams() {
    return { agencyId: 'test-agency-id', providerId: 'test-provider-id', jobId: 'test-job-id', bookingId: 'test-booking-id' }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
}))

// Mock Firebase with proper jest mocks
const mockGetDb = jest.fn();
const mockGetAuthInstance = jest.fn();

jest.mock('@/lib/firebase', () => ({
  getDb: mockGetDb,
  getAuthInstance: mockGetAuthInstance,
}));

// Set default mock implementations
mockGetDb.mockReturnValue({
  collection: jest.fn(),
  doc: jest.fn(),
});
mockGetAuthInstance.mockReturnValue({});

// Mock Firebase Firestore
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockOnSnapshot = jest.fn();
const mockServerTimestamp = jest.fn();
const mockWriteBatch = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  onSnapshot: mockOnSnapshot,
  serverTimestamp: mockServerTimestamp,
  writeBatch: mockWriteBatch,
  runTransaction: mockRunTransaction,
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date, toMillis: () => date.getTime() })),
    toDate: jest.fn((timestamp) => new Date(timestamp.toMillis())),
    toMillis: jest.fn(() => Date.now()),
  },
}))

// Set up default mock implementations
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Set up default successful responses
  mockGetDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ id: 'test-id', name: 'Test User', role: 'provider' })
  });
  
  mockGetDocs.mockResolvedValue({
    docs: [
      {
        id: 'doc-1',
        data: () => ({ id: 'doc-1', name: 'Test Document' })
      }
    ],
    forEach: jest.fn((callback) => {
      callback({
        id: 'doc-1',
        data: () => ({ id: 'doc-1', name: 'Test Document' })
      });
    })
  });
  
  mockAddDoc.mockResolvedValue({ id: 'new-doc-id' });
  mockUpdateDoc.mockResolvedValue(undefined);
  mockDeleteDoc.mockResolvedValue(undefined);
  
  // Set up onSnapshot to return mock data
  mockOnSnapshot.mockImplementation((query, callback) => {
    const mockData = {
      bookings: [
        { id: 'booking-1', status: 'Completed', price: 500, date: { toDate: () => new Date() } },
        { id: 'booking-2', status: 'Pending', price: 300, date: { toDate: () => new Date() } }
      ],
      transactions: [
        { id: 'tx-1', amount: 500, status: 'completed', type: 'service_payment' },
        { id: 'tx-2', amount: 300, status: 'pending', type: 'payout_request' }
      ],
      notifications: [
        { id: 'notif-1', message: 'Test notification', read: false, type: 'info' }
      ],
      users: [
        { id: 'user-1', role: 'provider', displayName: 'Test Provider' }
      ]
    };
    
    setTimeout(() => {
      callback({
        docs: mockData.bookings.map(item => ({
          id: item.id,
          data: () => item
        }))
      });
    }, 0);
    
    return jest.fn(); // Return unsubscribe function
  });
  
  mockServerTimestamp.mockReturnValue('mock-timestamp');
  
  // Set up batch mock
  const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
  };
  mockWriteBatch.mockReturnValue(mockBatch);
  
  // Set up transaction mock
  mockRunTransaction.mockImplementation((callback) => {
    const mockTransaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'test-id' })
      }),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    return callback(mockTransaction);
  });
});

// Mock Firebase Storage
const mockRef = jest.fn();
const mockUploadString = jest.fn();
const mockGetDownloadURL = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: mockRef,
  uploadString: mockUploadString,
  getDownloadURL: mockGetDownloadURL,
}))

// Set up storage mock implementations
beforeEach(() => {
  mockRef.mockReturnValue({ fullPath: 'test/path' });
  mockUploadString.mockResolvedValue({ ref: { fullPath: 'test/path' } });
  mockGetDownloadURL.mockResolvedValue('https://example.com/test-url');
});

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}))

// Mock Firebase Admin
jest.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    createUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  adminDb: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  adminStorage: {
    ref: jest.fn(),
  },
}))

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(() => Promise.resolve({ data: { id: 'mock-email-id' } })),
    },
  })),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}))

// Mock theme provider
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: jest.fn(),
    theme: 'light',
  }),
}))

// Mock AI flows
jest.mock('@/ai/flows/find-matching-providers', () => ({
  findMatchingProviders: jest.fn(),
}))

// Mock AuditLogger
jest.mock('@/lib/audit-logger', () => ({
  AuditLogger: {
    getInstance: jest.fn(() => ({
      logAction: jest.fn().mockResolvedValue(undefined),
    })),
  },
}))

// Component mocks removed to allow actual component testing

// Mock hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

jest.mock('@/hooks/use-error-handler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}))

// Mock auth context with proper jest mock
const mockUseAuth = jest.fn();
jest.mock('@/context/auth-context', () => ({
  useAuth: mockUseAuth,
}));

// Set default mock implementation
mockUseAuth.mockReturnValue({
  user: { id: 'test-user-id', role: 'provider', displayName: 'Test User' },
  loading: false,
  userRole: 'provider',
  verificationStatus: 'Verified',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
});

// Make mockUseAuth available globally for tests
global.mockUseAuth = mockUseAuth;

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock server-side APIs
global.Request = jest.fn().mockImplementation((url, options) => ({
  url,
  method: options?.method || 'GET',
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
}));

global.Response = jest.fn().mockImplementation((body, options) => ({
  status: options?.status || 200,
  statusText: options?.statusText || 'OK',
  headers: new Map(Object.entries(options?.headers || {})),
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
}));

// Mock Headers
global.Headers = jest.fn().mockImplementation((init) => {
  const headers = new Map();
  if (init) {
    if (Array.isArray(init)) {
      init.forEach(([key, value]) => headers.set(key, value));
    } else if (typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => headers.set(key, value));
    }
  }
  return {
    get: (name) => headers.get(name),
    set: (name, value) => headers.set(name, value),
    has: (name) => headers.has(name),
    delete: (name) => headers.delete(name),
    forEach: (callback) => headers.forEach(callback),
  };
});

// Mock TextEncoder for email components
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
