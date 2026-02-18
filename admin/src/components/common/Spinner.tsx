import React from "react";

interface SpinnerProps {
  /** Size of the spinner in pixels (width and height) */
  size?: number;
  /** Thickness of the spinner stroke (equivalent to border) */
  border?: number;
  /** Color of the spinning path (CSS color string, e.g., "#3b82f6" or "currentColor") */
  color?: string;
  /** Additional CSS classes for the container */
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  border = 4,
  color = "currentColor",
  className = "",
}) => {
  return (
    <div
      className={`spinner-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >
      {/* 
        Note: If you are using Next.js, <style jsx> works out of the box. 
        If you are using standard React, you can move these keyframes to your global CSS file.
      */}
      <style jsx>{`
        .spinner {
          animation: rotate 2s linear infinite;
          width: 100%;
          height: 100%;
        }
        .path {
          stroke: ${color};
          stroke-linecap: round;
          animation: dash 1.5s ease-in-out infinite;
        }
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>

      <svg className="spinner" viewBox="0 0 50 50">
        <circle
          className="path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth={border}
        />
      </svg>
    </div>
  );
};

export default Spinner;