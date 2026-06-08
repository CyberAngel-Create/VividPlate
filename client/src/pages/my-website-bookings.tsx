import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Users, Clock, Mail, Phone, Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
  notes: string | null;
  status: "pending" | "approved" | "declined";
  ownerNotes: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: HelpCircle },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: XCircle },
};

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: (id: number, status: string, notes: string) => void }) {
  const [ownerNotes, setOwnerNotes] = useState(booking.ownerNotes || "");
  const [showNotes, setShowNotes] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const handleAction = async (status: string) => {
    setUpdating(status);
    await onUpdate(booking.id, status, ownerNotes);
    setUpdating(null);
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
            {booking.status === "pending" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                  disabled={updating !== null}
                  onClick={() => handleAction("approved")}
                >
                  {updating === "approved" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 border-red-400 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  disabled={updating !== null}
                  onClick={() => handleAction("declined")}
                >
                  {updating === "declined" ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                  Decline
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-8 text-gray-500"
                onClick={() => handleAction("pending")}
                disabled={updating !== null}
              >
                Reset to Pending
              </Button>
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
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  let filtered = bookings;
  if (filter !== "all") {
    filtered = filtered.filter(b => b.status === filter);
  }
  if (dateFrom) {
    filtered = filtered.filter(b => b.bookingDate >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter(b => b.bookingDate <= dateTo);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(b =>
      b.guestName.toLowerCase().includes(q) ||
      b.guestEmail.toLowerCase().includes(q) ||
      (b.guestPhone && b.guestPhone.includes(q))
    );
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    declined: bookings.filter(b => b.status === "declined").length,
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

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-3 mb-4 items-end">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">From Date</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">To Date</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setSearchQuery(""); setFilter("all"); }} className="h-8 text-xs">
            Clear Filters
          </Button>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "approved", "declined"] as const).map(status => (
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
