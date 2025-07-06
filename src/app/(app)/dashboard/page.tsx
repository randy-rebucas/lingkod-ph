import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, Star, BriefcaseBusiness } from "lucide-react";

export default function DashboardPage() {
    const stats = [
        { title: "Total Earnings", value: "₱12,500", icon: <DollarSign className="h-6 w-6 text-muted-foreground" />, change: "+15% from last month" },
        { title: "Upcoming Bookings", value: "4", icon: <Calendar className="h-6 w-6 text-muted-foreground" />, change: "+2 this week" },
        { title: "Active Services", value: "3", icon: <BriefcaseBusiness className="h-6 w-6 text-muted-foreground" />, change: "" },
        { title: "Overall Rating", value: "4.8", icon: <Star className="h-6 w-6 text-muted-foreground" />, change: "Based on 25 reviews" },
    ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, Juan!</h1>
        <p className="text-muted-foreground">Here&apos;s a summary of your activity.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Add more dashboard components here, like recent bookings, messages, etc. */}
    </div>
  );
}
