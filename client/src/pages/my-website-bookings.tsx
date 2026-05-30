import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Users, Clock, Mail, Phone, Loader2, CheckCircle, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "no_show";
  ownerNotes: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: HelpCircle },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
  no_show: { label: "No Show", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: AlertCircle },
};

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: (id: number, status: string, notes: string) => void }) {
  const [ownerNotes, setOwnerNotes] = useState(booking.ownerNotes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    await onUpdate(booking.id, status, ownerNotes);
    setUpdating(false);
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-base">{booking.guestName}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {booking.bookingDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {booking.bookingTime}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {booking.partySize} {booking.partySize === 1 ? "guest" : "guests"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${booking.guestEmail}`} className="hover:underline truncate">{booking.guestEmail}</a>
              </span>
              {booking.guestPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {booking.guestPhone}
                </span>
              )}
            </div>
            {booking.notes && (
              <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">"{booking.notes}"</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Select value={booking.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirm</SelectItem>
                  <SelectItem value="cancelled">Cancel</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)} className="text-xs h-8">
              Notes
            </Button>
          </div>
        </div>
        {showNotes && (
          <div className="mt-3 space-y-2">
            <Label className="text-xs">Your private notes</Label>
            <Textarea
              value={ownerNotes}
              onChange={e => setOwnerNotes(e.target.value)}
              placeholder="Add notes about this booking..."
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onUpdate(booking.id, booking.status, ownerNotes)}
            >
              Save Notes
            </Button>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-2">Submitted {new Date(booking.createdAt).toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

export default function MyWebsiteBookingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery<{ bookings: Booking[] }>({
    queryKey: ["/api/my-website/bookings"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, ownerNotes }: { id: number; status: string; ownerNotes: string }) => {
      const res = await fetch(`/api/my-website/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, ownerNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-website/bookings"] });
      toast({ title: "Booking updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  const handleUpdate = (id: number, status: string, ownerNotes: string) => {
    updateMutation.mutate({ id, status, ownerNotes });
  };

  const bookings = data?.bookings || [];
  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    no_show: bookings.filter(b => b.status === "no_show").length,
  };

  return (
    <RestaurantOwnerLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/my-website")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Website
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Table Bookings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "confirmed", "cancelled", "no_show"] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {status === "all" ? "All" : STATUS_CONFIG[status]?.label} ({counts[status] ?? 0})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No bookings yet</p>
            <p className="text-sm">Bookings will appear here when guests submit requests from your website.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => (
              <BookingCard key={booking.id} booking={booking} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </RestaurantOwnerLayout>
  );
}
