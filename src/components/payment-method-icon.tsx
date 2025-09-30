
"use client";

import { memo, useMemo } from "react";
import { Wallet, Landmark, Store } from "lucide-react";

type PaymentMethodIconProps = {
    method: string;
};

export const PaymentMethodIcon = memo(function PaymentMethodIcon({ method }: PaymentMethodIconProps) {
    const icon = useMemo(() => {
        const lowerMethod = method.toLowerCase();
        if (lowerMethod.includes('gcash') || lowerMethod.includes('maya') || lowerMethod.includes('coins')) {
            return <Wallet className="h-6 w-6 text-blue-500" aria-hidden="true" />;
        }
        if (lowerMethod.includes('bdo') || lowerMethod.includes('bpi') || lowerMethod.includes('unionbank')) {
            return <Landmark className="h-6 w-6 text-red-700" aria-hidden="true" />;
        }
        if (lowerMethod.includes('7-eleven') || lowerMethod.includes('cebuana') || lowerMethod.includes('palawan') || lowerMethod.includes('mlhuillier')) {
            return <Store className="h-6 w-6 text-orange-500" aria-hidden="true" />;
        }
        return <Wallet className="h-6 w-6 text-muted-foreground" aria-hidden="true" />;
    }, [method]);

    return (
        <div className="flex-shrink-0" aria-label={`Payment method: ${method}`}>
            {icon}
        </div>
    );
});
