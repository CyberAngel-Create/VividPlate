import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useRestaurant } from '@/hooks/use-restaurant';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, RefreshCw, Image, FileImage, FileArchive, File, FileText, FileSpreadsheet, FileX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RestaurantOwnerHeader } from '@/components/layout/RestaurantOwnerHeader';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils';

// Type definitions from backend
type FileUpload = {
  id: number;
  userId: number;
  restaurantId: number | null;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  fileCategory: string;
  status: string | null;
  uploadedAt: string | null; // ISO date string
  metadata: Record<string, any> | null;
};

const ManageUploadsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { activeRestaurant } = useRestaurant();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);

  // Redirect if no restaurant is selected
  useEffect(() => {
    if (!activeRestaurant) {
      setLocation('/restaurants');
    }
  }, [activeRestaurant, setLocation]);

  // Query for fetching uploads for active restaurant
  const { 
    data: uploadsData, 
    isLoading: isLoadingUploads,
    refetch: refetchUploads
  } = useQuery({
    queryKey: ['/api/restaurants', activeRestaurant?.id, 'uploads'],
    queryFn: async () => {
      if (!activeRestaurant?.id) return null;
      const response = await apiRequest('GET', `/api/restaurants/${activeRestaurant.id}/uploads`);
      return response.json();
    },
    enabled: !!activeRestaurant?.id,
  });

  // Mutation for deleting a file
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest('DELETE', `/api/uploads/${fileId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('File deleted'),
        description: t('The file has been deleted successfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', activeRestaurant?.id, 'uploads'] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: t('Error deleting file'),
        description: (error as Error).message || t('An error occurred while deleting the file'),
        variant: 'destructive',
      });
    },
  });

  const handleDeleteFile = (file: FileUpload) => {
    setSelectedFile(file);
  };

  const confirmDeleteFile = () => {
    if (selectedFile) {
      deleteFileMutation.mutate(selectedFile.id);
    }
  };

  // Group uploads by category for the tabs
  const getUploadsByCategory = () => {
    if (!uploadsData) return {};
    
    return uploadsData.uploadsByCategory || {};
  };

  // Get uploads for the active tab
  const getActiveUploads = () => {
    if (!uploadsData) return [];
    
    if (activeTab === 'all') {
      return uploadsData.uploads || [];
    }
    
    const categories = getUploadsByCategory();
    return categories[activeTab] || [];
  };

  if (!currentRestaurant) {
    return null;
  }

  // Extract unique categories for tabs
  const categories = Object.keys(getUploadsByCategory()).sort();
  
  return (
    <div className="container py-6">
      <PageHeader
        title={t('Manage Uploads')}
        description={t('View and manage all your uploaded files')}
      />
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{currentRestaurant.name}</h2>
        <Button 
          onClick={() => refetchUploads()} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('Refresh')}
        </Button>
      </div>
      
      <div className="mb-6">
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="border-b mb-4">
            <ScrollArea className="whitespace-nowrap pb-2">
              <TabsList className="bg-transparent">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {t('All Files')}
                  {uploadsData?.total && <Badge variant="outline" className="ml-2">{uploadsData.total}</Badge>}
                </TabsTrigger>
                
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t(category)}
                    {uploadsData?.uploadsByCategory[category] && (
                      <Badge variant="outline" className="ml-2">{uploadsData.uploadsByCategory[category].length}</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </div>
          
          <TabsContent value={activeTab} className="mt-0">
            {isLoadingUploads ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : getActiveUploads().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getActiveUploads().map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base line-clamp-1" title={file.originalFilename}>
                        {file.originalFilename}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        {getFileTypeIcon(file.fileType)}
                        <span>{file.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.fileSize)}</span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-2 pb-2">
                      {file.fileType.startsWith('image/') ? (
                        <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                          <img 
                            src={file.fileUrl} 
                            alt={file.originalFilename}
                            className="object-cover w-full h-full" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.svg';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-muted rounded-md p-6 flex justify-center items-center aspect-video">
                          {getFileTypeIcon(file.fileType, 48)}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex justify-between items-center p-4 pt-2">
                      <div className="text-xs text-muted-foreground">
                        {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : t('Unknown date')}
                      </div>
                      
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="px-3 h-8"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('Delete File')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('Are you sure you want to delete this file? This action cannot be undone.')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDeleteFile}>
                                {deleteFileMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {t('Delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/40 rounded-lg">
                <FileX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('No files found')}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {activeTab === 'all'
                    ? t('You haven\'t uploaded any files for this restaurant yet.')
                    : t('You haven\'t uploaded any {{category}} files for this restaurant yet.', { category: activeTab })}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManageUploadsPage;