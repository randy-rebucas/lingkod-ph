import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <svg
      width="40"
      height="40"
      viewBox="0 0 165 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_303_3)">
        <path
          d="M82.4998 165C128.029 165 165 128.029 165 82.5C165 36.9705 128.029 0 82.4998 0C36.9703 0 0 36.9705 0 82.5C0 128.029 36.9703 165 82.4998 165Z"
          fill="#00528A"
        />
        <path
          d="M109.913 74.3418C109.913 74.3418 92.5484 72.0408 82.5 72.0408C72.4516 72.0408 55.0869 74.3418 55.0869 74.3418C55.0869 74.3418 63.7717 114.391 82.5 114.391C101.228 114.391 109.913 74.3418 109.913 74.3418Z"
          fill="#339E53"
        />
        <path
          d="M101.228 65.7173V51.4021H92.5434V61.3586H72.4565V51.4021H63.7717V65.7173H101.228Z"
          fill="#F7F8F8"
        />
        <path
          d="M86.8864 78.4348H82.5005V82.7935H78.1582V78.4348H73.7722V74.0761H78.1582V69.7174H82.5005V74.0761H86.8864V78.4348Z"
          fill="#F7F8F8"
        />
        <path
          d="M105.571 67.5C105.571 67.5 101.228 99.413 82.5 99.413C63.7717 99.413 59.4293 67.5 59.4293 67.5L82.5 61.3587L105.571 67.5Z"
          fill="#339E53"
        />
        <path
          d="M92.5433 110.027C92.5433 110.027 89.2607 107.418 82.4999 107.418C75.739 107.418 72.4564 110.027 72.4564 110.027C72.4564 110.027 68.114 112.636 72.4564 116.913C76.7988 121.189 82.4999 118.581 82.4999 118.581C82.4999 118.581 88.2009 121.189 92.5433 116.913C96.8857 112.636 92.5433 110.027 92.5433 110.027Z"
          fill="#F7F8F8"
        />
      </g>
      <defs>
        <clipPath id="clip0_303_3">
          <rect width="165" height="165" fill="white" />
        </clipPath>
      </defs>
    </svg>
    <div className="flex flex-col">
      <h1 className="text-3xl font-bold font-headline leading-none">
        <span style={{ color: "#00528A" }}>Local</span>
        <span style={{ color: "#339E53" }}>Pro</span>
      </h1>
      <p
        className="text-xs font-semibold"
        style={{ color: "#00528A" }}
      >
        Your Trusted Local Pros
      </p>
    </div>
  </div>
);
