import React from "react";

interface SpinnerProps {
  size?: number;
  border?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  border = 4,
  color = "border-t-blue-500",
  secondaryColor = "border-gray-300",
  className = "",
}) => {
  return (
    <div
      className={`rounded-full animate-spin ${color} ${secondaryColor} ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: border,
      }}
    />
  );
};

export default Spinner;