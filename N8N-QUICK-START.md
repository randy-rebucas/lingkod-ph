# n8n Quick Start Guide for LocalPro

## 🚀 Quick Setup (5 minutes)

### 1. Environment Setup
```bash
# Copy environment template
cp .env.n8n.example .env.n8n

# Edit environment variables
nano .env.n8n
```

### 2. Start n8n
```bash
# Start n8n with Docker
npm run n8n:start

# Check logs
npm run n8n:logs
```

### 3. Access n8n Interface
- **URL**: http://localhost:5678
- **Username**: admin
- **Password**: (from N8N_PASSWORD in .env.n8n)

### 4. Import Workflows
1. Go to **Workflows** in n8n interface
2. Click **Import from File**
3. Import these files:
   - `n8n/workflows/user-registration-automation.json`
   - `n8n/workflows/booking-status-automation.json`
   - `n8n/workflows/payment-verification-automation.json`

### 5. Configure Credentials
1. Go to **Credentials** in n8n
2. Set up:
   - **HTTP Request** (for LocalPro API calls)
   - **Email Send** (for notifications)
   - **Webhook** (for triggers)

## 🔧 Integration with LocalPro

### 1. Add n8n Dashboard to Admin Panel
```typescript
// In your admin dashboard component
import { N8nDashboard } from '@/components/n8n-dashboard';

export default function AdminDashboard() {
  return (
    <div>
      {/* Your existing admin content */}
      <N8nDashboard />
    </div>
  );
}
```

### 2. Trigger Workflows from Your App
```typescript
import { triggerN8nWorkflow } from '@/lib/webhook-verification';

// Trigger user registration workflow
await triggerN8nWorkflow('user-registration', {
  email: 'user@example.com',
  name: 'John Doe',
  role: 'provider'
});

// Trigger booking status workflow
await triggerN8nWorkflow('booking-update', {
  bookingId: 'booking-123',
  status: 'confirmed',
  clientEmail: 'client@example.com',
  serviceName: 'House Cleaning'
});
```

## 📊 Monitoring

### 1. View Workflow Status
- Access the n8n dashboard in your admin panel
- Monitor execution status, success rates, and performance

### 2. Check Logs
```bash
# View n8n logs
npm run n8n:logs

# View specific workflow executions
# (In n8n interface: Workflows > [Workflow] > Executions)
```

## 🛠️ Common Tasks

### Start/Stop n8n
```bash
npm run n8n:start    # Start n8n
npm run n8n:stop     # Stop n8n
npm run n8n:logs     # View logs
```

### Backup Workflows
```bash
npm run n8n:backup   # Export all workflows
```

### Update Workflows
1. Edit workflow in n8n interface
2. Test the workflow
3. Activate when ready

## 🔒 Security

### 1. Webhook Security
- All webhooks use signature verification
- API keys required for all requests
- Rate limiting implemented

### 2. Access Control
- n8n interface protected with basic auth
- API endpoints require authentication
- Database connections encrypted

## 🆘 Troubleshooting

### n8n Won't Start
```bash
# Check Docker status
docker ps

# Check logs
npm run n8n:logs

# Restart n8n
npm run n8n:stop
npm run n8n:start
```

### Workflows Not Triggering
1. Check webhook URLs in n8n
2. Verify environment variables
3. Check LocalPro API endpoints
4. Review n8n execution logs

### Email Not Sending
1. Verify SMTP credentials
2. Check email templates
3. Review email logs in n8n

## 📈 Next Steps

1. **Customize Workflows**: Modify workflows for your specific needs
2. **Add More Automation**: Create workflows for other processes
3. **Monitor Performance**: Set up alerts for workflow failures
4. **Scale Up**: Add more complex automation as needed

---

**Need Help?** Check the full [N8N-SETUP-GUIDE.md](./N8N-SETUP-GUIDE.md) for detailed configuration and advanced features.
