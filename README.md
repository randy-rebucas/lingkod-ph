# LocalPro - Service Marketplace Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**LocalPro** is a comprehensive service marketplace platform that connects clients with trusted local service providers in the Philippines. Built with modern web technologies, it offers a seamless experience for service discovery, booking management, payment processing, and business growth.

## 🌟 Features

### Core Platform Features
- **Multi-Role User System**: Support for Clients, Providers, Agencies, Admins, and Partners
- **Service Discovery**: Advanced search and filtering with location-based results
- **Booking Management**: Real-time booking system with calendar integration
- **Payment Processing**: Multiple payment methods (GCash, Maya, PayPal, Cards, Bank Transfer)
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
- **Primary Gateway**: Adyen (GCash, Cards, Bank Transfer)
- **Secondary Gateway**: PayPal (Subscriptions)
- **Manual Payments**: GCash, Maya, Bank Transfer with proof upload
- **Security**: HMAC verification, encrypted storage, audit logging

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
- Adyen account (for payments)
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
   
   # Adyen Payment Configuration
   ADYEN_API_KEY=your_adyen_api_key
   ADYEN_MERCHANT_ACCOUNT=your_merchant_account
   ADYEN_ENVIRONMENT=test
   ADYEN_CLIENT_KEY=your_client_key
   ADYEN_HMAC_KEY=your_hmac_key
   
   # PayPal Configuration
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_secret
   
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
- **GCash**: Automated payments via Adyen integration
- **Maya**: Manual payment with proof upload
- **PayPal**: Subscription payments and international transactions
- **Credit/Debit Cards**: Via Adyen integration
- **Bank Transfer**: Manual payment with proof upload

### Payment Features
- Real-time payment processing
- Automated commission deduction
- Payout management for providers
- Payment verification system
- Comprehensive audit logging
- Fraud detection and prevention

For detailed payment system documentation, see [README-PAYMENT-SYSTEM.md](./README-PAYMENT-SYSTEM.md).

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

- [Application Documentation](./docs/application-documentation.md)
- [API Documentation](./docs/api-documentation.md)
- [Role-Based Access Control](./docs/comprehensive-role-documentation.md)
- [Payment System Documentation](./docs/payment-system-documentation.md)
- [User Journey Guide](./docs/user-journey-guide.md)
- [Security Enhancements](./docs/security-enhancements.md)

## 🆘 Support

- **Email**: admin@localpro.asia
- **Phone**: +639179157515
- **Documentation**: [Help Center](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/localpro/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Adyen for payment processing
- Next.js team for the amazing framework
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling

---

**LocalPro** - Connecting communities with trusted local service providers across the Philippines. 🇵🇭
