import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Facebook, Twitter, Instagram, Mail, MessageSquare, X, Loader2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

interface ShareOptionsProps {
  menuUrl: string;
}

interface TeamMember {
  id: string;
  email: string;
  initials: string;
  color: string;
}

const ShareOptions = ({ menuUrl }: ShareOptionsProps) => {
  const [email, setEmail] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", email: "john.smith@example.com", initials: "JS", color: "bg-primary" },
    { id: "2", email: "alex.doe@example.com", initials: "AD", color: "bg-secondary" }
  ]);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(menuUrl).then(() => {
      toast({
        title: "Link copied",
        description: "The menu link has been copied to clipboard",
      });
    });
  };

  const shareVia = (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(menuUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(menuUrl)}&text=${encodeURIComponent("Check out our restaurant menu!")}`;
        break;
      case "instagram":
        // Instagram doesn't have a direct sharing URL, show a toast instead
        toast({
          title: "Instagram sharing",
          description: "Copy the link and share it on Instagram manually",
        });
        return;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent("Check out our restaurant menu")}&body=${encodeURIComponent(`Here's our restaurant menu: ${menuUrl}`)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out our restaurant menu: ${menuUrl}`)}`;
        break;
      case "sms":
        shareUrl = `sms:?body=${encodeURIComponent(`Check out our restaurant menu: ${menuUrl}`)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  const addTeamMember = () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    if (teamMembers.some(member => member.email === email)) {
      toast({
        title: "Error",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }
    
    // Generate random color and initials
    const colors = ["bg-primary", "bg-secondary", "bg-blue-500", "bg-green-500", "bg-purple-500"];
    const initials = email.split('@')[0].split('.').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    
    setTeamMembers([
      ...teamMembers,
      {
        id: Date.now().toString(),
        email,
        initials,
        color: colors[Math.floor(Math.random() * colors.length)]
      }
    ]);
    
    setEmail("");
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const sendInvites = () => {
    if (teamMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one team member",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Invites sent",
      description: `Menu link sent to ${teamMembers.length} team members`,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-heading font-semibold mb-4">Share Link</h2>
      <p className="text-midgray mb-6">Share your menu link directly with customers.</p>
      
      <div className="mb-6">
        <label className="block text-midgray mb-2" htmlFor="menuLink">Your Menu Link</label>
        <div className="flex">
          <Input 
            type="text" 
            id="menuLink" 
            className="flex-grow border border-gray-300 rounded-l-md px-3 py-2 bg-gray-50" 
            value={menuUrl} 
            readOnly 
          />
          <Button 
            className="bg-primary hover:bg-primary/90 text-white rounded-l-none"
            onClick={copyToClipboard}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <h3 className="font-medium mb-3">Share via</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("facebook")}
        >
          <Facebook className="text-blue-600 mr-2 h-4 w-4" /> Facebook
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("twitter")}
        >
          <Twitter className="text-blue-400 mr-2 h-4 w-4" /> Twitter
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("instagram")}
        >
          <Instagram className="text-pink-600 mr-2 h-4 w-4" /> Instagram
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("email")}
        >
          <Mail className="text-red-500 mr-2 h-4 w-4" /> Email
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("whatsapp")}
        >
          <FaWhatsapp className="text-green-500 mr-2 h-4 w-4" /> WhatsApp
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center"
          onClick={() => shareVia("sms")}
        >
          <MessageSquare className="text-blue-500 mr-2 h-4 w-4" /> SMS
        </Button>
      </div>
      
      <h3 className="font-medium mb-3">Share with your team</h3>
      <div className="mb-4">
        <div className="flex mb-2">
          <Input 
            type="email" 
            placeholder="Enter email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow border border-gray-300 rounded-l-md"
          />
          <Button 
            className="bg-secondary hover:bg-secondary/90 text-white rounded-l-none"
            onClick={addTeamMember}
          >
            Add
          </Button>
        </div>
        
        {teamMembers.length > 0 ? (
          <div className="bg-neutral p-3 rounded-md">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex justify-between items-center mb-2 last:mb-0">
                <div className="flex items-center">
                  <div className={`w-8 h-8 ${member.color} text-white rounded-full flex items-center justify-center mr-2`}>
                    <span className="text-sm font-bold">{member.initials}</span>
                  </div>
                  <span className="text-sm">{member.email}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-midgray hover:text-destructive transition-colors h-6 w-6 p-0"
                  onClick={() => removeTeamMember(member.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral p-3 rounded-md text-center text-sm text-midgray">
            No team members added yet
          </div>
        )}
      </div>
      
      <Button 
        className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center"
        onClick={sendInvites}
      >
        <Mail className="mr-1 h-4 w-4" /> Send Invites
      </Button>
    </div>
  );
};

export default ShareOptions;
