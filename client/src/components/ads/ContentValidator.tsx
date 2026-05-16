import React from "react";

interface ContentValidatorProps {
  children: React.ReactNode;
}

const ContentValidator: React.FC<ContentValidatorProps> = ({ children }) => <>{children}</>;

export default ContentValidator;