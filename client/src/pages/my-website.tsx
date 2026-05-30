import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RestaurantOwnerLayout from "@/components/layout/RestaurantOwnerLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, Lock, Zap, Image, ExternalLink, Calendar, Check,
  Upload, X, Instagram, Facebook, Twitter, Loader2,
  Palette, BookOpen, Images
} from "lucide-react";

interface WebsiteData {
  isPaid: boolean;
  addonActive: boolean;
  restaurant: any;
  website: any;
}

const TEMPLATES = [
  {
    id: "elegant",
    name: "Elegant",
    description: "Dark background, serif fonts, gold accents — classic fine dining feel",
    preview: "bg-gray-900 text-yellow-400",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean white, bold sans-serif, vibrant accent — fresh and contemporary",
    preview: "bg-white text-orange-500 border",
  },
];

export default function MyWebsitePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const heroInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<WebsiteData>({
    queryKey: ["/api/my-website"],
  });

  const [form, setForm] = useState({
    slug: "",
    template: "elegant",
    tagline: "",
    aboutText: "",
    heroImageUrl: "",
    bookingEnabled: true,
    showMenuLink: true,
    isPublished: false,
    accentColor: "",
    galleryImages: [] as string[],
    socialLinks: { instagram: "", facebook: "", twitter: "" },
  });

  const [heroUploading, setHeroUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Populate form from fetched data
  useEffect(() => {
    if (data?.website) {
      const w = data.website;
      setForm({
        slug: w.slug || "",
        template: w.template || "elegant",
        tagline: w.tagline || "",
        aboutText: w.aboutText || "",
        heroImageUrl: w.heroImageUrl || "",
        bookingEnabled: w.bookingEnabled ?? true,
        showMenuLink: w.customSettings?.showMenuLink ?? true,
        isPublished: w.isPublished ?? false,
        accentColor: w.customSettings?.accentColor || "",
        galleryImages: (w.galleryImages as string[]) || [],
        socialLinks: (w.socialLinks as any) || { instagram: "", facebook: "", twitter: "" },
      });
    } else if (data?.restaurant && !data?.website) {
      const name = data.restaurant.name || "";
      setForm(prev => ({
        ...prev,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
      }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { accentColor, showMenuLink, galleryImages, ...rest } = payload;
      const body = {
        ...rest,
        galleryImages,
        customSettings: {
          ...(data?.website?.customSettings || {}),
          accentColor,
          showMenuLink,
        },
      };
      const res = await fetch("/api/my-website", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-website"] });
      toast({ title: "Saved!", description: "Your website settings have been saved." });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/my-website/hero-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setForm(prev => ({ ...prev, heroImageUrl: json.url }));
      toast({ title: "Hero image uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setHeroUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 6 - form.galleryImages.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) {
      toast({ title: "Gallery full", description: "Maximum 6 gallery images allowed.", variant: "destructive" });
      return;
    }
    setGalleryUploading(true);
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/my-website/gallery-image", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        urls.push(json.url);
      }
      setForm(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...urls] }));
      toast({ title: `${urls.length} image${urls.length > 1 ? "s" : ""} added to gallery` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleAddonCheckout = async () => {
    try {
      const res = await fetch("/api/ls/website-addon-checkout", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <RestaurantOwnerLayout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </RestaurantOwnerLayout>
    );
  }

  // Not paid
  if (!data?.isPaid) {
    return (
      <RestaurantOwnerLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8">
            <Lock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Premium Feature</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The Website Builder is available on the Premium plan. Upgrade first, then activate the add-on.
            </p>
            <Button onClick={() => setLocation("/ls-subscribe")} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade to Premium · $25/mo
            </Button>
          </div>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  // Paid but addon not active
  if (!data?.addonActive) {
    return (
      <RestaurantOwnerLayout>
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="text-center mb-8">
            <Globe className="h-14 w-14 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Restaurant Website Builder</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Create a stunning public-facing website for your restaurant — with table bookings built in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {TEMPLATES.map(t => (
              <div key={t.id} className={`rounded-xl p-6 ${t.preview} shadow-md`}>
                <h3 className="text-xl font-bold mb-1">{t.name}</h3>
                <p className="text-sm opacity-75">{t.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 mb-6">
            <h2 className="font-semibold text-lg mb-3">What's included</h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {[
                "Professional website at yourname.vividplate.com/site/your-slug",
                "2 beautiful templates: Elegant & Modern",
                "Full colour & font customization",
                "Hero image & photo gallery",
                "Table booking system with management dashboard",
                "Your full menu displayed beautifully",
                "Social media links",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold mb-1">$15<span className="text-base font-normal text-gray-500">/month</span></p>
            <p className="text-sm text-gray-500 mb-4">Added to your existing Premium subscription</p>
            <Button size="lg" onClick={handleAddonCheckout} className="bg-primary text-white px-8">
              <Zap className="h-4 w-4 mr-2" />
              Activate Website Builder
            </Button>
          </div>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  // No restaurant
  if (!data?.restaurant) {
    return (
      <RestaurantOwnerLayout>
        <div className="max-w-lg mx-auto py-12 text-center">
          <p className="text-gray-500 mb-4">Create a restaurant first before building your website.</p>
          <Button onClick={() => setLocation("/edit-restaurant")}>Create Restaurant</Button>
        </div>
      </RestaurantOwnerLayout>
    );
  }

  const siteUrl = `/site/${form.slug}`;

  return (
    <RestaurantOwnerLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              My Website
            </h1>
            {form.isPublished && form.slug && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                {window.location.origin}/site/{form.slug}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isPublished}
                onCheckedChange={v => setForm(prev => ({ ...prev, isPublished: v }))}
                id="publish-toggle"
              />
              <Label htmlFor="publish-toggle" className="cursor-pointer">
                {form.isPublished ? (
                  <Badge className="bg-green-500 text-white">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </Label>
            </div>
            <Button onClick={() => setLocation("/my-website/bookings")} variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Bookings
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending}
              size="sm"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        <Tabs defaultValue="design" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="design">
              <Palette className="h-4 w-4 mr-1" />
              Design
            </TabsTrigger>
            <TabsTrigger value="content">
              <BookOpen className="h-4 w-4 mr-1" />
              Content
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Globe className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template</CardTitle>
                <CardDescription>Choose the visual style for your website</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, template: t.id }))}
                      className={`rounded-xl p-5 text-left transition-all border-2 ${
                        form.template === t.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className={`rounded-lg p-3 mb-3 ${t.preview}`}>
                        <div className="h-3 w-20 rounded bg-current opacity-80 mb-1.5" />
                        <div className="h-2 w-28 rounded bg-current opacity-40 mb-1" />
                        <div className="h-2 w-16 rounded bg-current opacity-30" />
                      </div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
                      {form.template === t.id && (
                        <Badge className="mt-2 bg-primary text-white text-xs">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hero Image</CardTitle>
                <CardDescription>The full-width banner shown at the top of your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.heroImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={form.heroImageUrl} alt="Hero" className="w-full h-40 object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setForm(prev => ({ ...prev, heroImageUrl: "" }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => heroInputRef.current?.click()}
                  >
                    {heroUploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    ) : (
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-gray-500">Click to upload a hero image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP up to 10MB</p>
                  </div>
                )}
                <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                {!form.heroImageUrl && (
                  <Button variant="outline" size="sm" onClick={() => heroInputRef.current?.click()} disabled={heroUploading}>
                    <Image className="h-4 w-4 mr-1" />
                    Upload Hero Image
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accent Colour</CardTitle>
                <CardDescription>The primary colour used for highlights and buttons on your site</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accentColor || "#e2852a"}
                    onChange={e => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700 p-0.5"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={e => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                    placeholder="#e2852a"
                    className="w-36 font-mono text-sm"
                    maxLength={7}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400"
                    onClick={() => setForm(prev => ({ ...prev, accentColor: "" }))}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-4 w-4" />
                  Photo Gallery
                </CardTitle>
                <CardDescription>Up to 6 photos shown on your website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.galleryImages.map((url, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden aspect-square">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => setForm(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {form.galleryImages.length < 6 && (
                  <>
                    <div
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      {galleryUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-1" />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      )}
                      <p className="text-sm text-gray-500">
                        Click to add photos ({form.galleryImages.length}/6)
                      </p>
                    </div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Story</CardTitle>
                <CardDescription>Tell your visitors about your restaurant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="e.g. Fine dining since 1985"
                    value={form.tagline}
                    onChange={e => setForm(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aboutText">About Text</Label>
                  <Textarea
                    id="aboutText"
                    placeholder="Tell your story — your history, your philosophy, what makes your food special..."
                    value={form.aboutText}
                    onChange={e => setForm(prev => ({ ...prev, aboutText: e.target.value }))}
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
                <CardDescription>Link your social media profiles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500 flex-shrink-0" />
                  <Input
                    placeholder="https://instagram.com/yourpage"
                    value={form.socialLinks.instagram}
                    onChange={e => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <Input
                    placeholder="https://facebook.com/yourpage"
                    value={form.socialLinks.facebook}
                    onChange={e => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500 flex-shrink-0" />
                  <Input
                    placeholder="https://twitter.com/yourhandle"
                    value={form.socialLinks.twitter}
                    onChange={e => setForm(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Website URL</CardTitle>
                <CardDescription>Your public website address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">/site/</span>
                    <Input
                      id="slug"
                      placeholder="my-restaurant"
                      value={form.slug}
                      onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") }))}
                    />
                  </div>
                  {form.slug && (
                    <p className="text-xs text-gray-500">
                      Public URL: {window.location.origin}/site/{form.slug}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Table Bookings</CardTitle>
                <CardDescription>Allow visitors to request a table reservation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Booking Form</p>
                    <p className="text-sm text-gray-500">Guests can submit table booking requests from your website</p>
                  </div>
                  <Switch
                    checked={form.bookingEnabled}
                    onCheckedChange={v => setForm(prev => ({ ...prev, bookingEnabled: v }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link to Digital Menu</CardTitle>
                <CardDescription>Show a "View Our Full Menu" button linking to your VividPlate digital menu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Menu Link</p>
                    <p className="text-sm text-gray-500">Adds a button on your website that opens your full digital menu</p>
                  </div>
                  <Switch
                    checked={form.showMenuLink}
                    onCheckedChange={v => setForm(prev => ({ ...prev, showMenuLink: v }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
                <CardDescription>Control whether your website is visible to the public</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Website Published</p>
                    <p className="text-sm text-gray-500">
                      {form.isPublished ? "Your website is live and accessible to everyone" : "Your website is in draft mode — only you can see it"}
                    </p>
                  </div>
                  <Switch
                    checked={form.isPublished}
                    onCheckedChange={v => setForm(prev => ({ ...prev, isPublished: v }))}
                  />
                </div>
                {form.isPublished && form.slug && (
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View your live website
                  </a>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6 gap-3">
          {form.isPublished && form.slug && (
            <Button variant="outline" asChild>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview Site
              </a>
            </Button>
          )}
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </RestaurantOwnerLayout>
  );
}
