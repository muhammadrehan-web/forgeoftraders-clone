/**
 * Next.js root layout (required).
 * Page HTML is served as full documents from route handlers so the original
 * layout/CSS/JS stay pixel-identical.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
