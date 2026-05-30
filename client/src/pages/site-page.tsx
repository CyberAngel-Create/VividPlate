import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Calendar, ChevronDown } from "lucide-react";

interface SiteData {
  website: {
    id: number;
    slug: string;
    template: "elegant" | "modern";
    isPublished: boolean;
    bookingEnabled: boolean;
    heroImageUrl: string | null;
    tagline: string | null;
    aboutText: string | null;
    galleryImages: any[];
    socialLinks: { instagram?: string; facebook?: string; twitter?: string };
    customSettings: Record<string, any>;
  };
  restaurant: {
    id: number;
    name: string;
    description: string | null;
    cuisine: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
    hoursOfOperation: Record<string, any> | null;
  };
  menu: Array<{
    id: number;
    name: string;
    items: Array<{
      id: number;
      name: string;
      description: string | null;
      price: string;
      currency: string;
      imageUrl: string | null;
      isAvailable: boolean;
    }>;
  }>;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 10;
  const m = i % 2 === 0 ? "00" : "30";
  const hour = h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? "PM" : "AM";
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${hour}:${m} ${ampm}` };
});

function BookingForm({ slug }: { slug: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    partySize: "2",
    bookingDate: "",
    bookingTime: "19:00",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`/api/site/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, partySize: parseInt(data.partySize) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Booking failed");
      return json;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "Booking request submitted!", description: "The restaurant will be in touch to confirm." });
    },
    onError: (err: any) => {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
    },
  });

  const minDate = new Date().toISOString().split("T")[0];

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
        <p className="text-gray-500">We've received your booking request. The restaurant will contact you at {form.guestEmail} to confirm.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="guestName">Full Name *</Label>
          <Input id="guestName" required value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))} placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guestEmail">Email *</Label>
          <Input id="guestEmail" type="email" required value={form.guestEmail} onChange={e => setForm(p => ({ ...p, guestEmail: e.target.value }))} placeholder="your@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guestPhone">Phone</Label>
          <Input id="guestPhone" type="tel" value={form.guestPhone} onChange={e => setForm(p => ({ ...p, guestPhone: e.target.value }))} placeholder="+1 555 000 0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partySize">Party Size *</Label>
          <Select value={form.partySize} onValueChange={v => setForm(p => ({ ...p, partySize: v }))}>
            <SelectTrigger id="partySize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => (
                <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "guest" : "guests"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookingDate">Date *</Label>
          <Input id="bookingDate" type="date" required min={minDate} value={form.bookingDate} onChange={e => setForm(p => ({ ...p, bookingDate: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bookingTime">Time *</Label>
          <Select value={form.bookingTime} onValueChange={v => setForm(p => ({ ...p, bookingTime: v }))}>
            <SelectTrigger id="bookingTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Special Requests</Label>
        <Textarea id="notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Allergies, celebrations, accessibility needs..." rows={3} />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
        Request Booking
      </Button>
    </form>
  );
}

// ── Elegant Template ─────────────────────────────────────────────────────────

function ElegantTemplate({ data }: { data: SiteData }) {
  const { website, restaurant, menu } = data;
  const [menuOpen, setMenuOpen] = useState(false);
  const social = website.socialLinks || {};

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-serif">
      {/* Hero */}
      <div className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6"
        style={website.heroImageUrl ? {
          backgroundImage: `url(${website.heroImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      >
        {website.heroImageUrl && <div className="absolute inset-0 bg-black/60" />}
        <div className="relative z-10">
          {restaurant.logoUrl && (
            <img src={restaurant.logoUrl} alt={restaurant.name} className="h-20 w-20 rounded-full object-cover mx-auto mb-6 border-2 border-yellow-400" />
          )}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-wide">{restaurant.name}</h1>
          {website.tagline && <p className="text-yellow-400 text-xl md:text-2xl italic mb-6">{website.tagline}</p>}
          {restaurant.cuisine && <p className="text-gray-300 text-sm uppercase tracking-widest">{restaurant.cuisine}</p>}
          <div className="flex gap-3 justify-center mt-6">
            {website.bookingEnabled && (
              <a href="#booking" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full text-sm uppercase tracking-wide transition-colors">
                Reserve a Table
              </a>
            )}
            <a href="#menu" className="border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 px-6 py-3 rounded-full text-sm uppercase tracking-wide transition-colors">
              Our Menu
            </a>
          </div>
        </div>
      </div>

      {/* About */}
      {(website.aboutText || restaurant.description) && (
        <section className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">Our Story</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            {website.aboutText || restaurant.description}
          </p>
        </section>
      )}

      {/* Menu */}
      <section id="menu" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-yellow-400 text-center mb-2">Menu</h2>
        <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-10" />
        {menu.map(cat => (
          <div key={cat.id} className="mb-10">
            <h3 className="text-xl font-semibold text-yellow-300 uppercase tracking-widest mb-4 pb-2 border-b border-yellow-900">{cat.name}</h3>
            <div className="space-y-3">
              {cat.items.filter(i => i.isAvailable).map(item => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover flex-shrink-0 opacity-90" />
                    )}
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      {item.description && <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                  <p className="text-yellow-400 font-semibold whitespace-nowrap">{item.currency || "USD"} {item.price}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Info */}
      <section className="bg-gray-900 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {restaurant.address && (
            <div>
              <MapPin className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-300 mb-1 uppercase tracking-wide text-sm">Location</h4>
              <p className="text-gray-400 text-sm">{restaurant.address}</p>
            </div>
          )}
          {restaurant.phone && (
            <div>
              <Phone className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-300 mb-1 uppercase tracking-wide text-sm">Phone</h4>
              <a href={`tel:${restaurant.phone}`} className="text-gray-400 text-sm hover:text-yellow-400">{restaurant.phone}</a>
            </div>
          )}
          {restaurant.email && (
            <div>
              <Mail className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-300 mb-1 uppercase tracking-wide text-sm">Email</h4>
              <a href={`mailto:${restaurant.email}`} className="text-gray-400 text-sm hover:text-yellow-400">{restaurant.email}</a>
            </div>
          )}
        </div>
      </section>

      {/* Booking */}
      {website.bookingEnabled && (
        <section id="booking" className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-yellow-400 text-center mb-2">Reserve a Table</h2>
          <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-10" />
          <div className="bg-gray-900 rounded-2xl p-6 border border-yellow-900">
            <BookingForm slug={website.slug} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center">
        <p className="text-gray-500 text-sm font-semibold tracking-wide mb-3">{restaurant.name}</p>
        <div className="flex justify-center gap-4 mb-4">
          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 transition-colors"><Instagram className="h-5 w-5" /></a>}
          {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 transition-colors"><Facebook className="h-5 w-5" /></a>}
          {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-yellow-400 transition-colors"><Twitter className="h-5 w-5" /></a>}
        </div>
        <p className="text-gray-600 text-xs">Powered by VividPlate</p>
      </footer>
    </div>
  );
}

// ── Modern Template ─────────────────────────────────────────────────────────

function ModernTemplate({ data }: { data: SiteData }) {
  const { website, restaurant, menu } = data;
  const social = website.socialLinks || {};

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {restaurant.logoUrl && <img src={restaurant.logoUrl} alt={restaurant.name} className="h-8 w-8 rounded-full object-cover" />}
          <span className="font-bold text-gray-900">{restaurant.name}</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#about" className="hover:text-orange-500 transition-colors">About</a>
          <a href="#menu" className="hover:text-orange-500 transition-colors">Menu</a>
          {website.bookingEnabled && (
            <a href="#booking" className="bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-colors">Book a Table</a>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div
        className="relative pt-16 min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
        style={website.heroImageUrl ? {
          backgroundImage: `url(${website.heroImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : { background: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fdba74 100%)" }}
      >
        {website.heroImageUrl && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10">
          <h1 className={`text-5xl md:text-7xl font-extrabold mb-4 ${website.heroImageUrl ? "text-white" : "text-gray-900"}`}>
            {restaurant.name}
          </h1>
          {website.tagline && (
            <p className={`text-xl md:text-2xl mb-6 font-medium ${website.heroImageUrl ? "text-orange-200" : "text-orange-600"}`}>
              {website.tagline}
            </p>
          )}
          {restaurant.cuisine && (
            <span className="inline-block bg-orange-500 text-white text-sm font-semibold px-4 py-1 rounded-full mb-6">
              {restaurant.cuisine}
            </span>
          )}
          <div className="flex gap-3 justify-center mt-4">
            {website.bookingEnabled && (
              <a href="#booking" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-full text-sm transition-colors shadow-lg">
                Reserve a Table
              </a>
            )}
            <a href="#menu" className={`font-bold px-6 py-3 rounded-full text-sm transition-colors ${website.heroImageUrl ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm" : "bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"}`}>
              View Menu
            </a>
          </div>
        </div>
      </div>

      {/* About */}
      {(website.aboutText || restaurant.description) && (
        <section id="about" className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Our Story</div>
          <p className="text-gray-600 text-lg leading-relaxed">
            {website.aboutText || restaurant.description}
          </p>
        </section>
      )}

      {/* Menu */}
      <section id="menu" className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">What We Serve</div>
            <h2 className="text-4xl font-extrabold text-gray-900">Our Menu</h2>
          </div>
          {menu.map(cat => (
            <div key={cat.id} className="mb-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-orange-400 inline-block" />
                {cat.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.items.filter(i => i.isAvailable).map(item => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-start border border-gray-100">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-orange-600 font-bold text-sm whitespace-nowrap">{item.currency || ""} {item.price}</p>
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Find Us</div>
            <h2 className="text-3xl font-extrabold text-gray-900">Visit Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {restaurant.address && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <MapPin className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <h4 className="font-bold text-gray-900 mb-1">Location</h4>
                <p className="text-gray-500 text-sm">{restaurant.address}</p>
              </div>
            )}
            {restaurant.phone && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <Phone className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <h4 className="font-bold text-gray-900 mb-1">Phone</h4>
                <a href={`tel:${restaurant.phone}`} className="text-gray-500 text-sm hover:text-orange-500">{restaurant.phone}</a>
              </div>
            )}
            {restaurant.email && (
              <div className="bg-gray-50 rounded-2xl p-5">
                <Mail className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <h4 className="font-bold text-gray-900 mb-1">Email</h4>
                <a href={`mailto:${restaurant.email}`} className="text-gray-500 text-sm hover:text-orange-500">{restaurant.email}</a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booking */}
      {website.bookingEnabled && (
        <section id="booking" className="bg-orange-50 py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Reservations</div>
              <h2 className="text-3xl font-extrabold text-gray-900">Book a Table</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <BookingForm slug={website.slug} />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 px-6 text-center">
        <p className="font-bold text-lg mb-1">{restaurant.name}</p>
        {restaurant.cuisine && <p className="text-gray-400 text-sm mb-4">{restaurant.cuisine}</p>}
        <div className="flex justify-center gap-4 mb-4">
          {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transition-colors"><Instagram className="h-5 w-5" /></a>}
          {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transition-colors"><Facebook className="h-5 w-5" /></a>}
          {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400 transition-colors"><Twitter className="h-5 w-5" /></a>}
        </div>
        <p className="text-gray-500 text-xs">Powered by VividPlate</p>
      </footer>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function SitePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<SiteData>({
    queryKey: [`/api/site/${slug}`],
    queryFn: async () => {
      const res = await fetch(`/api/site/${slug}`);
      if (!res.ok) throw new Error("Website not found");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">404</h1>
        <p className="text-gray-500 mb-6">This restaurant website doesn't exist or isn't published yet.</p>
        <a href="/" className="text-orange-500 hover:underline">← Back to VividPlate</a>
      </div>
    );
  }

  if (data.website.template === "modern") {
    return <ModernTemplate data={data} />;
  }

  return <ElegantTemplate data={data} />;
}
