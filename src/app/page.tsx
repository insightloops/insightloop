import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              InsightLoop
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform fragmented customer feedback into structured, actionable product insights using 
            <span className="text-primary font-semibold"> AI-powered analytics</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 text-2xl">
                📊
              </div>
              <CardTitle className="text-xl">Feedback Ingestion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload CSV files, integrate with tools like Intercom, Zendesk, and more
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 text-2xl ai-glow">
                🤖
              </div>
              <CardTitle className="text-xl">AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically cluster feedback, analyze sentiment, and generate actionable insights
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-14 h-14 bg-gradient-to-br from-success/20 to-warning/20 rounded-xl flex items-center justify-center mb-4 text-2xl">
                🎯
              </div>
              <CardTitle className="text-xl">Strategic Prioritization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Link insights to features and OKRs with intelligent prioritization
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="text-4xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Ready to unlock better insights?
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Set up your company and product in just 2 minutes to start analyzing feedback with 
                <span className="text-primary font-semibold"> AI-powered intelligence</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" variant="ai" className="mb-6 text-lg px-8 py-3">
                <Link href="/onboarding">
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>
                  Already have an account?{" "}
                  <Link href="/dashboard" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                    Go to Dashboard
                  </Link>
                </div>
                <div>
                  Want to try the AI Agent?{" "}
                  <Link href="/chat" className="text-primary hover:underline font-semibold hover:text-primary/80 transition-colors">
                    Chat with Agent
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
