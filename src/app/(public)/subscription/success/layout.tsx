
export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background">
        {children}
    </div>
  );
}
