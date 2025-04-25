import { useState, useRef, ChangeEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Restaurant } from "@shared/schema";
import { Download, Printer } from "lucide-react";

interface QRCodeGeneratorProps {
  restaurant: Restaurant;
  menuUrl: string;
}

const QRCodeGenerator = ({ restaurant, menuUrl }: QRCodeGeneratorProps) => {
  const [size, setSize] = useState<number>(300);
  const [qrColor, setQrColor] = useState<string>("#FF6B35");
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQrColor(e.target.value);
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${restaurant.name.replace(/\s+/g, "-")}-menu-qr.png`;
      link.href = url;
      link.click();
    }
  };

  const printQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const windowContent = `
        <html>
          <head>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .info {
                margin-top: 20px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <img src="${url}" />
            <div class="info">
              <h2>${restaurant.name}</h2>
              <p>Scan to view our menu</p>
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(windowContent);
        printWindow.document.close();
        
        // Wait for the image to load before printing
        printWindow.onload = function() {
          printWindow.print();
          printWindow.close();
        };
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-heading font-semibold mb-4">QR Code</h2>
      <p className="text-midgray mb-6">
        Customers can scan this QR code to view your menu on their devices.
      </p>
      
      <div className="flex flex-col items-center">
        <div 
          className="bg-white p-4 border rounded-lg w-48 h-48 flex items-center justify-center mb-4"
          ref={qrRef}
        >
          <QRCodeCanvas
            value={menuUrl}
            size={size}
            bgColor={"#ffffff"}
            fgColor={qrColor}
            level={"L"}
            imageSettings={
              includeLogo && restaurant.logoUrl
                ? {
                    src: restaurant.logoUrl,
                    x: undefined,
                    y: undefined,
                    height: 50,
                    width: 50,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>
        
        <div className="flex space-x-2 w-full">
          <Button 
            className="flex-1 bg-primary text-white hover:bg-primary/90 flex items-center justify-center"
            onClick={downloadQRCode}
          >
            <Download className="mr-1 h-4 w-4" /> Download
          </Button>
          <Button 
            className="flex-1 bg-secondary text-white hover:bg-secondary/90 flex items-center justify-center"
            onClick={printQRCode}
          >
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="font-medium mb-2">QR Code Options</h3>
        <div className="space-y-3">
          <div>
            <Label className="block text-sm text-midgray mb-1" htmlFor="qrSize">
              Size
            </Label>
            <Select 
              value={size.toString()} 
              onValueChange={(value) => setSize(parseInt(value))}
            >
              <SelectTrigger id="qrSize">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="200">Small (200x200px)</SelectItem>
                <SelectItem value="300">Medium (300x300px)</SelectItem>
                <SelectItem value="400">Large (400x400px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm text-midgray mb-1" htmlFor="qrColor">
              Color
            </Label>
            <div className="flex items-center">
              <Input 
                type="color" 
                id="qrColor" 
                value={qrColor} 
                onChange={handleColorChange}
                className="h-9 w-12 border border-gray-300 rounded-md mr-2"
              />
              <span className="text-sm text-midgray">{qrColor}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="includeLogo" 
              checked={includeLogo}
              onCheckedChange={(checked) => setIncludeLogo(checked === true)}
            />
            <Label
              htmlFor="includeLogo"
              className="text-sm text-midgray cursor-pointer"
            >
              Include restaurant logo
            </Label>
          </div>
          
          <Button 
            className="w-full bg-dark text-white hover:bg-dark/80 mt-2"
            onClick={() => {
              // Force QR code to re-render with current settings
              setSize(size => size);
            }}
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
