# LocalPro - Service Marketplace Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Google AI](https://img.shields.io/badge/Google%20AI-Genkit-blue?style=flat-square&logo=google)](https://ai.google.dev/)
[![Maya](https://img.shields.io/badge/Maya-Payment%20Gateway-green?style=flat-square)](https://www.maya.ph/)
[![PayPal](https://img.shields.io/badge/PayPal-Payment%20Gateway-blue?style=flat-square&logo=paypal)](https://www.paypal.com/)

**LocalPro** is a comprehensive service marketplace platform that connects clients with trusted local service providers in the Philippines. Built with modern web technologies and AI-powered features, it offers a seamless experience for service discovery, booking management, payment processing, and business growth.

## 🚀 Platform Highlights

- **5 User Roles**: Client, Provider, Agency, Admin, Partner with distinct capabilities
- **AI-Powered Features**: Smart rate suggestions, provider matching, content generation
- **Multiple Payment Methods**: Maya, PayPal, Bank Transfer with real-time processing
- **Comprehensive Dashboard**: Role-specific dashboards with analytics and insights
- **Learning Hub**: Educational content and resources for all user types
- **Real-time Communication**: In-app messaging and email notifications
- **Internationalization**: English and Filipino (Tagalog) support
- **Mobile-First Design**: Responsive design optimized for all devices

## 🌟 Features

### Core Platform Features
- **Multi-Role User System**: Support for Clients, Providers, Agencies, Admins, and Partners
- **Service Discovery**: Advanced search and filtering with location-based results
- **Booking Management**: Real-time booking system with calendar integration
- **Payment Processing**: Multiple payment methods (PayPal, Bank Transfer)
- **AI-Powered Features**: Smart rate suggestions, quote builder, and provider matching
- **Internationalization**: English and Filipino (Tagalog) support
- **Real-time Communication**: In-app messaging and email notifications

### User Roles & Capabilities

#### 👤 **Client** (Default Role)
- Browse and search service providers
- Book services and manage appointments
- Post job requests for providers to apply
- Rate and review completed services
- Manage favorites and profile

#### 🔧 **Provider** (Individual Professionals)
- Create and manage service profiles
- Handle booking requests and calendar
- Track earnings and request payouts
- Access analytics and performance metrics
- Apply to job postings

#### 🏢 **Agency** (Business Entities)
- Manage multiple providers under one account
- Centralized booking and earnings management
- Advanced reporting and analytics
- Branded communications
- Subscription-based feature access

#### 👑 **Admin** (Platform Administrators)
- Complete platform management
- User verification and moderation
- Payment verification and processing
- System monitoring and analytics
- Content and service management

#### 🤝 **Partner** (Referral Partners)
- Referral tracking and commission management
- Partner dashboard and analytics
- Marketing tools and resources

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **State Management**: React Context + Custom hooks
- **Internationalization**: next-intl
- **Icons**: Lucide React

### Backend & Services
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with role-based access control
- **Storage**: Firebase Storage for file uploads
- **Real-time**: Firebase Realtime Database for live updates
- **Email**: Resend with React Email templates
- **AI Integration**: Google AI (Genkit) for smart features

### Payment System
- **Maya Integration**: Credit/Debit cards, e-wallets, QR codes, bank transfers
- **PayPal Integration**: Global payments, subscriptions, buyer protection
- **Bank Transfer**: Manual payments with proof upload and verification
- **Security**: End-to-end encryption, fraud detection, audit logging
- **Real-time Processing**: Instant payment confirmation and status updates

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript strict mode
- **Code Formatting**: Prettier
- **Git Hooks**: Husky for pre-commit checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- PayPal account (for subscriptions)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/localpro.git
   cd localpro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   
   # PayPal Configuration
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   
   # Maya Configuration
   NEXT_PUBLIC_MAYA_PUBLIC_KEY=your_maya_public_key
   MAYA_SECRET_KEY=your_maya_secret_key
   MAYA_ENVIRONMENT=sandbox
   MAYA_WEBHOOK_SECRET=your_maya_webhook_secret
   
   # Google AI Configuration
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   GOOGLE_AI_PROJECT_ID=your_project_id
   
   # Email Configuration
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@localpro.asia
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:9002
   JWT_SECRET=your_jwt_secret
   ENCRYPTION_KEY=your_encryption_key
   ```

4. **Set up Firebase**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:9002
   - Admin Panel: http://localhost:9002/admin

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Protected app routes
│   │   ├── admin/         # Admin dashboard and management
│   │   ├── dashboard/     # User dashboard
│   │   ├── bookings/      # Booking management
│   │   ├── payments/      # Payment processing
│   │   └── ...           # Other feature pages
│   ├── (public)/         # Public pages (home, about, etc.)
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Radix UI)
│   └── ...              # Feature-specific components
├── lib/                 # Utility functions and configurations
│   ├── firebase.ts      # Firebase configuration
│   ├── auth.ts          # Authentication utilities
│   ├── payment-*.ts     # Payment system modules
│   └── ...              # Other utilities
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization setup
└── emails/              # Email templates
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking

# AI Development
npm run genkit:dev       # Start Genkit AI development server
npm run genkit:watch     # Start Genkit with file watching

# Email Development
npm run email            # Start email development server

# Payment System
npm run validate-payments # Validate payment system configuration
npm run setup-dev        # Set up development environment
```

## 💳 Payment System

LocalPro includes a comprehensive payment system supporting multiple payment methods:

### Supported Payment Methods
- **Maya Checkout**: Credit/Debit cards, e-wallets (GCash, GrabPay), QR codes, bank transfers
- **PayPal**: Global payments, subscriptions, buyer protection
- **Bank Transfer**: Manual payment with proof upload and admin verification

### Payment Features
- Real-time payment processing with instant confirmation
- Automated commission calculation and deduction
- Secure payout management for providers
- Multi-layer payment verification system
- Comprehensive audit logging and transaction history
- Advanced fraud detection and prevention
- Webhook integration for real-time status updates
- Support for recurring payments and subscriptions

### Payment Security
- End-to-end encryption for all transactions
- PCI DSS compliance for card payments
- IP address verification for webhooks
- Signature validation for payment confirmations
- Rate limiting and abuse prevention
- Secure token-based payment processing

For detailed payment system documentation, see [Payment System Documentation](./docs/payment-system-documentation.md).

## 🔐 Security Features

- **Authentication**: Firebase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encrypted storage and transmission
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API rate limiting and abuse prevention
- **Audit Logging**: Complete audit trail for all actions
- **2FA Support**: Two-factor authentication for admin accounts

## 🌐 Internationalization

LocalPro supports multiple languages:
- **English** (default)
- **Filipino/Tagalog**

Language files are located in the `messages/` directory. To add a new language:

1. Create a new JSON file in `messages/`
2. Add the language configuration in `src/i18n/request.ts`
3. Update the language switcher component

## 📊 Monitoring & Analytics

- **Real-time Monitoring**: Payment processing and system health
- **User Analytics**: User behavior and engagement metrics
- **Performance Tracking**: Response times and system performance
- **Error Tracking**: Comprehensive error logging and alerting
- **Business Metrics**: Revenue, bookings, and provider performance

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   npm run start
   ```

3. **Firebase Deployment**
   ```bash
   firebase deploy
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and patterns

## 📚 Documentation

LocalPro includes comprehensive documentation covering all aspects of the platform. The documentation is organized into several categories to help users, developers, and administrators find the information they need.

### 📖 Core Documentation

#### **Getting Started**
- **[User Journey Guide](./docs/user-journey-guide.md)** - Complete step-by-step user journeys for all roles
- **[Comprehensive Role Documentation](./docs/comprehensive-role-documentation.md)** - Detailed guide to all user roles and capabilities

#### **Technical Documentation**
- **[API Documentation](./docs/api-documentation.md)** - Complete API reference with all endpoints
- **[Component Documentation](./docs/component-documentation.md)** - Comprehensive React component library
- **[Payment System Documentation](./docs/payment-system-documentation.md)** - Complete payment system guide
- **[AI Flows Documentation](./docs/ai-flows-documentation.md)** - AI-powered features using Google AI (Genkit)
- **[Email Templates Documentation](./docs/email-templates-documentation.md)** - Email system and templates

### 🚀 Quick Start Guides

#### **For Users**
- **New to LocalPro?** Start with [User Journey Guide](./docs/user-journey-guide.md)
- **Understanding Roles?** Read [Comprehensive Role Documentation](./docs/comprehensive-role-documentation.md)
- **Need Help with Payments?** Check [Payment System Documentation](./docs/payment-system-documentation.md)

#### **For Developers**
- **API Integration?** See [API Documentation](./docs/api-documentation.md)
- **Component Development?** Review [Component Documentation](./docs/component-documentation.md)
- **AI Features?** Check [AI Flows Documentation](./docs/ai-flows-documentation.md)

#### **For Administrators**
- **Platform Management?** Read [Comprehensive Role Documentation](./docs/comprehensive-role-documentation.md)
- **Payment Operations?** See [Payment System Documentation](./docs/payment-system-documentation.md)
- **Email Management?** Review [Email Templates Documentation](./docs/email-templates-documentation.md)

### 📊 Documentation Overview

- **User Guides**: Complete user journey documentation for all roles
- **API Documentation**: REST API reference with all endpoints and examples
- **Component Library**: Comprehensive React component documentation
- **Payment System**: Complete payment integration and processing guide
- **AI Features**: AI-powered features and automation documentation
- **Email System**: Email templates and notification system guide

### 🔄 Documentation Updates

This documentation is regularly updated to reflect platform changes and improvements. Key areas of focus:

- **New Features**: Documentation for new platform features
- **API Changes**: API endpoint updates and modifications
- **User Experience**: Improved user journey documentation
- **Payment System**: Payment method and process updates
- **AI Features**: New AI-powered capabilities

### 📝 Contributing to Documentation

If you find errors or have suggestions for improving the documentation:

1. **Report Issues**: Submit documentation issues or suggestions
2. **Request Updates**: Request updates for specific sections
3. **Provide Feedback**: Share feedback on documentation clarity and usefulness
4. **Suggest Improvements**: Propose enhancements to existing documentation

### 🆘 Documentation Support

- **Documentation Questions**: admin@localpro.asia
- **Technical Issues**: admin@localpro.asia
- **Feature Requests**: admin@localpro.asia

## 🆘 Support

- **Email**: admin@localpro.asia
- **Phone**: +639179157515
- **Documentation**: [Help Center](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/localpro/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for backend infrastructure and real-time capabilities
- **Maya (PayMaya)** for Philippine payment processing
- **PayPal** for global payment solutions
- **Google AI (Genkit)** for AI-powered features
- **Next.js** team for the amazing React framework
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **React Email** for beautiful email templates
- **Resend** for reliable email delivery

---

**LocalPro** - Connecting communities with trusted local service providers across the Philippines. 🇵🇭

*Built with ❤️ for the Filipino service industry*
