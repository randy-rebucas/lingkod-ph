"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function PayPalConfigCheck() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const isConfigured = !!clientId;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          PayPal Configuration Status
        </CardTitle>
        <CardDescription>
          Check if PayPal is properly configured
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Client ID:</span>
          <div className="flex items-center gap-2">
            {clientId ? (
              <>
                <Badge variant="outline" className="text-xs">
                  {clientId.substring(0, 10)}...
                </Badge>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </>
            ) : (
              <>
                <Badge variant="destructive" className="text-xs">
                  Not Set
                </Badge>
                <XCircle className="h-4 w-4 text-red-500" />
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Configuration:</span>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <>
                <Badge className="bg-green-100 text-green-800">
                  Configured
                </Badge>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </>
            ) : (
              <>
                <Badge variant="destructive">
                  Not Configured
                </Badge>
                <XCircle className="h-4 w-4 text-red-500" />
              </>
            )}
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>PayPal is not configured.</strong> Please add the following environment variable:
            </p>
            <code className="block mt-2 text-xs bg-red-100 p-2 rounded">
              NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
