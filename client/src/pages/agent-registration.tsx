import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, CheckCircle, Clock, XCircle, User, FileText } from "lucide-react";
import AgentLayout from "@/components/layout/AgentLayout";

const agentFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().optional(),
  idType: z.string().min(1, "ID type is required"),
  idNumber: z.string().min(3, "ID number is required"),
  idFrontImageUrl: z.string().optional(),
  idBackImageUrl: z.string().optional(),
  selfieImageUrl: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

interface Agent {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export default function AgentRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const { data: existingAgent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents/me"],
    retry: false,
  });

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      city: "",
      state: "",
      country: "Ethiopia",
      postalCode: "",
      idType: "",
      idNumber: "",
      idFrontImageUrl: "",
      idBackImageUrl: "",
      selfieImageUrl: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const response = await apiRequest("POST", "/api/agents/register", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Submitted",
        description: "Your agent registration has been submitted for review. You will be notified once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit agent registration",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (file: File, field: 'idFrontImageUrl' | 'idBackImageUrl' | 'selfieImageUrl') => {
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await apiRequest('POST', '/api/upload/agent-document', formData, true);
      const data = await res.json();
      if (data && data.imageUrl) {
        form.setValue(field, data.imageUrl);
        toast({ title: 'Upload Successful', description: 'Document uploaded successfully' });
      } else {
        throw new Error('Invalid upload response');
      }
    } catch (err: any) {
      console.error('Agent document upload failed:', err);
      toast({ title: 'Upload Failed', description: err.message || 'Failed to upload document', variant: 'destructive' });
    } finally {
      setUploadingField(null);
    }
  };

  const onSubmit = (data: AgentFormData) => {
    registerMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-4 h-4 mr-1" /> Pending Review</Badge>;
    }
  };

  if (agentLoading) {
    return (
      <AgentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AgentLayout>
    );
  }

  // Show status view only if the agent actually submitted an application
  // or if the approval status is explicitly approved/rejected
  if (
    existingAgent &&
    existingAgent.id !== -1 &&
    ((existingAgent as any).applicationSubmitted || existingAgent.approvalStatus === 'approved' || existingAgent.approvalStatus === 'rejected')
  ) {
    return (
      <AgentLayout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" onClick={() => setLocation("/agent-dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-6 h-6" />
                Agent Status
              </CardTitle>
              <CardDescription>
                Your agent registration status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{existingAgent.firstName} {existingAgent.lastName}</p>
                  <p className="text-sm text-muted-foreground">Registered Agent</p>
                </div>
                {getStatusBadge(existingAgent.approvalStatus)}
              </div>
              
              {existingAgent.approvalStatus === 'pending' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Pending Review
                  </p>
                  <p className="text-yellow-800 dark:text-yellow-200 mt-1">
                    Your application is under review. This usually takes 1-2 business days.
                    You will be able to create restaurants once approved.
                  </p>
                </div>
              )}
              
              {existingAgent.approvalStatus === 'approved' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-800 dark:text-green-200">
                    Congratulations! Your agent application has been approved. 
                    You can now create and manage restaurants.
                  </p>
                  <Button className="mt-4" onClick={() => setLocation("/agent-dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              )}
              
              {existingAgent.approvalStatus === 'rejected' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-800 dark:text-red-200">
                    Your application was not approved. 
                    {existingAgent.rejectionReason && (
                      <span className="block mt-2">Reason: {existingAgent.rejectionReason}</span>
                    )}
                    Please contact support for more information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="w-6 h-6" />
              Complete Your Agent Registration
            </CardTitle>
            <CardDescription className="text-base">
              <span className="font-semibold text-foreground">Almost there!</span> To create and manage restaurants on VividPlate, 
              please complete your agent profile below. This is a one-time verification process.
            </CardDescription>
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Required:</strong> Fill in all fields and upload your ID document. 
                After submission, your application will be reviewed within 1-2 business days.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Addis Ababa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Region (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="State or region" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Ethiopia" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">ID Document</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="idType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ID type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="national_id">National ID</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your ID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Document uploads are optional but recommended for faster approval.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">ID Front</label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {form.watch('idFrontImageUrl') ? (
                            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                          ) : (
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="idFront"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'idFrontImageUrl')}
                          />
                          <label htmlFor="idFront" className="cursor-pointer text-sm text-primary hover:underline">
                            {uploadingField === 'idFrontImageUrl' ? 'Uploading...' : 'Upload'}
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ID Back</label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {form.watch('idBackImageUrl') ? (
                            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                          ) : (
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="idBack"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'idBackImageUrl')}
                          />
                          <label htmlFor="idBack" className="cursor-pointer text-sm text-primary hover:underline">
                            {uploadingField === 'idBackImageUrl' ? 'Uploading...' : 'Upload'}
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Selfie</label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {form.watch('selfieImageUrl') ? (
                            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
                          ) : (
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="selfie"
                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'selfieImageUrl')}
                          />
                          <label htmlFor="selfie" className="cursor-pointer text-sm text-primary hover:underline">
                            {uploadingField === 'selfieImageUrl' ? 'Uploading...' : 'Upload'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
}
