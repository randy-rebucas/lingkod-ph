
"use client";

import { Wallet, Landmark, Store, QrCode } from "lucide-react";

type PaymentMethodIconProps = {
    method: string;
};

export function PaymentMethodIcon({ method }: PaymentMethodIconProps) {
    const renderIcon = () => {
        const lowerMethod = method.toLowerCase();
        if (lowerMethod.includes('gcash') || lowerMethod.includes('maya') || lowerMethod.includes('coins')) {
            return <Wallet className="h-6 w-6 text-blue-500" />;
        }
        if (lowerMethod.includes('bdo') || lowerMethod.includes('bpi') || lowerMethod.includes('unionbank')) {
            return <Landmark className="h-6 w-6 text-red-700" />;
        }
        if (lowerMethod.includes('7-eleven') || lowerMethod.includes('cebuana') || lowerMethod.includes('palawan') || lowerMethod.includes('mlhuillier')) {
            return <Store className="h-6 w-6 text-orange-500" />;
        }
        return <Wallet className="h-6 w-6 text-muted-foreground" />;
    };

    return <div className="flex-shrink-0">{renderIcon()}</div>;
}
