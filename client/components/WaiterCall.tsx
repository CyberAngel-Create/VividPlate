import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, User, Phone } from 'lucide-react';

interface WaiterCallProps {
  restaurantId: number;
  restaurantName: string;
}

export function WaiterCall({ restaurantId, restaurantName }: WaiterCallProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const callWaiterMutation = useMutation({
    mutationFn: async (data: { restaurantId: number; tableNumber: string; notes?: string }) => {
      return await apiRequest('POST', '/api/waiter-calls', {
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        message: data.notes || `Customer at table ${data.tableNumber} needs assistance`,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Waiter Called',
        description: `Your waiter has been notified for table ${tableNumber}`,
        variant: 'default',
      });
      setTableNumber('');
      setNotes('');
      setIsDialogOpen(false); // Close the popup after successful call
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to call waiter. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      toast({
        title: 'Table Number Required',
        description: 'Please enter your table number',
        variant: 'destructive',
      });
      return;
    }

    callWaiterMutation.mutate({
      restaurantId,
      tableNumber: tableNumber.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className="w-full max-w-xs mx-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0"
        >
          <Bell className="w-5 h-5 mr-2" />
          Call Waiter
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-full max-w-md mx-auto bg-white shadow-2xl border-2 border-amber-100">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl text-gray-800">
            <Phone className="w-6 h-6 text-amber-600" />
            Call Waiter
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Need assistance? Let us know your table number
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-2">
            <label htmlFor="tableNumber" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Table Number
            </label>
            <Input
              id="tableNumber"
              type="text"
              placeholder="e.g., Table 5 or T-12"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full tablet:text-lg tablet:py-3 border-gray-200 focus:border-amber-400 focus:ring-amber-200"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Additional Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Any specific requests or needs..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-20 tablet:min-h-24 tablet:text-lg border-gray-200 focus:border-amber-400 focus:ring-amber-200 resize-none"
              rows={3}
            />
          </div>
          
          <Button
            type="submit"
            disabled={callWaiterMutation.isPending || !tableNumber.trim()}
            className="w-full tablet:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 tablet:text-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {callWaiterMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Calling Waiter...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <span>Call Waiter</span>
              </div>
            )}
          </Button>
        </form>
        
        <div className="mt-4 mx-6 mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800 text-center">
            <span className="font-medium">{restaurantName}</span> • Your waiter will be with you shortly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}