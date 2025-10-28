import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "../hooks/useWallet";
import { FhevmProvider } from "../fhevm/useFhevm";
import { WalletConnect } from "../components/WalletConnect";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VeilVoting - Privacy-Preserving Voting",
  description: "Vote behind the veil with FHEVM encryption",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <FhevmProvider>
            <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/20 dark:from-neutral-950 dark:via-primary-950/30 dark:to-secondary-950/20">
              {/* Header */}
              <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-primary-100 dark:border-primary-900/20">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                      <div className="text-3xl">🎭</div>
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                          VeilVoting
                        </h1>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Vote Behind the Veil
                        </p>
                      </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                      <Link
                        href="/all-proposals"
                        className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        All Proposals
                      </Link>
                      <Link
                        href="/proposals/create"
                        className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        Create
                      </Link>
                      <Link
                        href="/history"
                        className="text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        My Votes
                      </Link>
                    </nav>

                    <WalletConnect />
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <main className="container mx-auto px-4 py-8">{children}</main>

              {/* Footer */}
              <footer className="mt-16 border-t border-primary-100 dark:border-primary-900/20 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl">
                <div className="container mx-auto px-4 py-8">
                  <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
                    <p>Powered by Zama FHEVM - Your votes are encrypted on-chain</p>
                    <p className="mt-2">🔐 Privacy • 🗳️ Transparency • ⚡ Blockchain</p>
                  </div>
                </div>
              </footer>
            </div>
          </FhevmProvider>
        </WalletProvider>
      </body>
    </html>
  );
}


