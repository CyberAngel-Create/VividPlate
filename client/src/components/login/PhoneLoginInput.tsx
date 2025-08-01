import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, ArrowRight } from "lucide-react";

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const popularCountryCodes: CountryCode[] = [
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dialCode: "+251" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "CN", name: "China", flag: "🇨🇳", dialCode: "+86" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dialCode: "+81" },
];

interface PhoneLoginInputProps {
  onPhoneSubmit: (phoneNumber: string) => void;
  className?: string;
}

export const PhoneLoginInput = ({ onPhoneSubmit, className = "" }: PhoneLoginInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(popularCountryCodes[0]); // Default to Ethiopia
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleCountryChange = (countryCode: string) => {
    const country = popularCountryCodes.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value.replace(/[^\d]/g, ""); // Only allow digits
    setPhoneNumber(number);
  };

  const handleSubmit = () => {
    if (phoneNumber.trim()) {
      const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
      onPhoneSubmit(fullNumber);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-32">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {popularCountryCodes.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.dialCode}</span>
                  <span className="text-sm text-muted-foreground">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onKeyPress={handleKeyPress}
            placeholder="Phone number"
            className="pl-10"
          />
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={!phoneNumber.trim()}
          size="icon"
          className="shrink-0"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Full number: {selectedCountry.dialCode}{phoneNumber}
      </div>
    </div>
  );
};

export default PhoneLoginInput;