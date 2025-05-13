import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackDialogProps {
  menuItemId?: number;
  menuItemName?: string;
  restaurantId: number;
  trigger?: React.ReactNode;
}

function FeedbackDialog({
  menuItemId,
  menuItemName,
  restaurantId,
  trigger,
}: FeedbackDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: t("Please select a rating"),
        description: t("You must provide a rating to submit feedback"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", `/api/restaurants/${restaurantId}/feedback`, {
        menuItemId,
        rating,
        comment: comment.trim() === "" ? null : comment,
        customerName: customerName.trim() === "" ? null : customerName,
        customerEmail: customerEmail.trim() === "" ? null : customerEmail,
      });

      if (response.ok) {
        toast({
          title: t("Thank you for your feedback!"),
          description: t("Your feedback has been submitted successfully."),
        });
        setIsOpen(false);
        resetForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit feedback");
      }
    } catch (error) {
      toast({
        title: t("Failed to submit feedback"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setComment("");
    setCustomerName("");
    setCustomerEmail("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-sm">
            {t("Click to leave feedback")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {menuItemName
              ? t("feedback.leaveItemFeedback", "Leave feedback for {{name}}", { name: menuItemName })
              : t("feedback.leaveFeedback", "Leave feedback")}
          </DialogTitle>
          <DialogDescription>
            {t("feedback.shareExperience", "Share your experience with us. Your feedback helps us improve!")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">{t("feedback.comments", "Comments (optional)")}</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("feedback.tellExperience", "Tell us about your experience")}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerName">{t("feedback.name", "Your Name (optional)")}</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("feedback.enterName", "Enter your name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerEmail">{t("feedback.email", "Your Email (optional)")}</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder={t("feedback.enterEmail", "Enter your email")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              {t("feedback.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? t("feedback.submitting", "Submitting...") : t("feedback.submit", "Submit Feedback")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackDialog;