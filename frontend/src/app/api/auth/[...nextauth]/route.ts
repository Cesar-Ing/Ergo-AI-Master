import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { cookies } from "next/headers";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "supersecret_nextauth_key_2026",
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        // Mapear el nombre del proveedor para el backend
        const providerName = account?.provider === "azure-ad" ? "outlook" : account?.provider || "unknown";

        const response = await fetch(`${backendUrl}/auth/social-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            full_name: user.name || profile?.name || "Usuario Outlook",
            provider: providerName
          }),
        });

        if (response.ok) {
          const data = await response.json();
          (user as any).backendToken = data.access_token;
          (user as any).role = data.role || "user";
          
          const cookieStore = await cookies();
          cookieStore.set('ergoai_token', data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 
          });
          
          return true;
        }
        
        console.error("Backend rechazó el login social:", await response.text());
        return false;
      } catch (error) {
        console.error("Error crítico conectando con el backend durante OAuth:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Pasa los datos del backend a la sesión JWT de NextAuth
      if (user) {
        if ((user as any).backendToken) token.backendToken = (user as any).backendToken;
        if ((user as any).role) token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Pone los datos en la sesión para que el cliente los use
      if (token.backendToken) {
        (session as any).backendToken = token.backendToken;
      }
      if (token.role) {
        (session as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };
