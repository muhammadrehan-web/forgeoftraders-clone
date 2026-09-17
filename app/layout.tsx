/**
 * Root layout required by Next.js.
 * HTML pages are returned directly from route handlers, so this shell is unused for those responses.
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
