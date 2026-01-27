import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PricingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Pricing Unavailable</CardTitle>
          <CardDescription>
            Pricing has been removed. Please contact your agent for upgrades.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button onClick={() => setLocation("/request-restaurant")}>Contact Agent</Button>
        </CardContent>
      </Card>
    </div>
  );
}