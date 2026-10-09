import './globals.css';

export const metadata = {
  title: 'Meta Ad Account Recharge',
  description: 'Monitor your Meta Ads balance and recharge it yourself — no need to contact support.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
