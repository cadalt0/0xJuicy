export async function createWallet(mail_address: string): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_WALLET_API_BASE;
  if (!apiBase) {
    throw new Error('NEXT_PUBLIC_WALLET_API_BASE environment variable is not set');
  }
  try {
    const walletRes = await fetch(`${apiBase}/api/create-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail_address }),
    });
    return walletRes.ok;
  } catch (e) {
    console.error('Error creating wallet:', e);
    return false;
  }
} 