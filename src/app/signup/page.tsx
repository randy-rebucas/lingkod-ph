import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

const SignUpForm = ({ userType }: { userType: 'Client' | 'Provider' | 'Agency' }) => (
  <form className="space-y-4">
    {userType === 'Agency' ? (
      <>
        <div className="space-y-2">
          <Label htmlFor={`${userType}-business-name`}>Business Name</Label>
          <Input id={`${userType}-business-name`} placeholder="Lingkod Inc." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${userType}-contact-person`}>Contact Person</Label>
          <Input id={`${userType}-contact-person`} placeholder="Juan Dela Cruz" required />
        </div>
      </>
    ) : (
      <div className="space-y-2">
        <Label htmlFor={`${userType}-name`}>Full Name</Label>
        <Input id={`${userType}-name`} placeholder="Juan Dela Cruz" required />
      </div>
    )}

    <div className="space-y-2">
      <Label htmlFor={`${userType}-email`}>Email</Label>
      <Input id={`${userType}-email`} type="email" placeholder="m@example.com" required />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor={`${userType}-phone`}>Mobile Number</Label>
      <Input id={`${userType}-phone`} type="tel" placeholder="09123456789" required />
    </div>

    <div className="space-y-2">
      <Label htmlFor={`${userType}-password`}>Password</Label>
      <Input id={`${userType}-password`} type="password" required />
    </div>

    <Button type="submit" className="w-full">Create Account</Button>
  </form>
);


export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
         <CardHeader className="text-center space-y-2">
           <Link href="/" className="inline-block">
              <Logo />
            </Link>
          <CardTitle className="text-2xl">Join Lingkod PH</CardTitle>
          <CardDescription>Choose your account type and let&apos;s get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="agency">Agency</TabsTrigger>
            </TabsList>
            <TabsContent value="client">
                <p className="text-sm text-muted-foreground my-4 text-center">Create an account to find and book reliable services.</p>
                <SignUpForm userType="Client" />
            </TabsContent>
            <TabsContent value="provider">
                <p className="text-sm text-muted-foreground my-4 text-center">Offer your skills and services to a wider audience.</p>
                <SignUpForm userType="Provider" />
            </TabsContent>
            <TabsContent value="agency">
                <p className="text-sm text-muted-foreground my-4 text-center">Manage your team and grow your service business.</p>
                <SignUpForm userType="Agency" />
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="space-y-4">
            <Button variant="outline" className="w-full">Sign up with Google</Button>
            <Button variant="outline" className="w-full">Sign up with Facebook</Button>
          </div>

          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
