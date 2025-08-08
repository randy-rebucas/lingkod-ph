
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Users, Heart, Lightbulb, Target, BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";


const whyChooseUs = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: "Trusted & Verified",
    description: "Every provider on our platform undergoes a verification process to ensure you hire with confidence and peace of mind.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Empowering Local Pros",
    description: "We're dedicated to supporting local entrepreneurs and skilled workers by providing them with the tools to grow their businesses.",
  },
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: "Seamless Experience",
    description: "From booking and communication to secure payments, our platform is designed to make everything simple and hassle-free.",
  },
];


export default function AboutPage() {
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">About LocalPro</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Connecting communities with trusted local service providers.
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-16 mt-16">
        <section className="text-center">
            <Target className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold font-headline">Our Mission</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
                Our mission is to build a stronger, more connected Philippines by empowering local service professionals and making it easy for communities to access trusted, high-quality services. We believe in creating economic opportunities and fostering a culture of reliability and excellence.
            </p>
        </section>

        <section className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-3xl font-bold font-headline">Our Story</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
               LocalPro was born from a simple idea: what if finding a reliable plumber, electrician, or cleaner was as easy as a few clicks? Frustrated by the challenges of finding trustworthy professionals, our founders set out to create a platform that bridges the gap between skilled local workers and the communities that need them, all built on a foundation of trust and technology.
            </p>
        </section>
      </div>
      
      <section className="mt-20">
         <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold font-headline">Why Choose LocalPro?</h2>
         </div>
         <div className="mx-auto grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
             {whyChooseUs.map((item) => (
                <Card key={item.title} className="flex flex-col items-center text-center p-6">
                    {item.icon}
                    <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-muted-foreground">{item.description}</p>
                </Card>
             ))}
         </div>
      </section>
      
       <section className="mt-20">
        <Card className="max-w-3xl mx-auto bg-secondary">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
                Whether you're a skilled professional looking to grow your business or someone passionate about our cause, we'd love for you to be a part of our journey.
            </p>
            <div className="flex justify-center gap-4">
                <Button asChild size="lg">
                  <Link href="/careers">
                    View Careers <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                   <Link href="/partners">
                    Partner With Us
                  </Link>
                </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
