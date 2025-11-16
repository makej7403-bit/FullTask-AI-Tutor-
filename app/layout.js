export const metadata = {
  title: "FullTask AI Tutor",
  description: "Advanced AI assistant with chat, audio, video, and Google login."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
