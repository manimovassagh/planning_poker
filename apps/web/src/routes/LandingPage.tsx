import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Eye, BarChart3, Zap } from "lucide-react";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Planning Poker
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Estimate story points with your scrum team in real-time. Simple,
          fast, and built for collaboration.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Users,
            title: "Team Voting",
            description:
              "Everyone votes simultaneously. No anchoring bias.",
          },
          {
            icon: Eye,
            title: "Hidden Until Reveal",
            description:
              "Votes stay hidden until the facilitator reveals them.",
          },
          {
            icon: BarChart3,
            title: "Analytics",
            description:
              "See vote distribution, average, and consensus level.",
          },
          {
            icon: Zap,
            title: "Real-time",
            description:
              "Instant updates. See who has voted as it happens.",
          },
        ].map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-lg border border-border p-6 text-center">
            <Icon className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
