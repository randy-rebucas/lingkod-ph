
"use client";

export function QRCode() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="200"
      height="200"
      shapeRendering="crispEdges"
    >
      <path fill="#ffffff" d="M0 0h100v100H0z" />
      <path
        fill="#000000"
        d="M10 10h20v20H10z m60 0h20v20H70z M10 70h20v20H10z M15 15h10v10H15z m60 0h10v10H75z M15 75h10v10H15z M40 10h10v10H40z M60 10h10v10H60z M30 20h10v10H30z m20 0h10v10H50z M70 20h10v10H70z M10 30h10v10H10z m20 0h10v10H30z m10 10h10v10H40z m20 0h10v10H60z M10 50h10v10H10z m20 0h10v10H30z m20 0h10v10H50z m20 0h10v10H70z m-40 10h10v10H30z M50 60h10v10H50z M70 60h10v10H70z M40 70h10v10H40z m20 0h10v10H60z M10 40h20v10H10z M70 30h20v10H70z M40 80h20v10H40z M40 40h10v20H40z M60 50h10v20H60z"
      />
    </svg>
  );
}
