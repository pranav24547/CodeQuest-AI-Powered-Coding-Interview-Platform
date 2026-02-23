import "./globals.css";

export const metadata = {
  title: "CodeQuest | AI-Powered Coding Interview Platform",
  description: "Master coding interviews with AI-powered feedback, 100+ problems, mock interviews, and real-time code execution. Built for FAANG preparation.",
  keywords: "coding interview, DSA, leetcode, algorithm, data structures, AI, mock interview",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
