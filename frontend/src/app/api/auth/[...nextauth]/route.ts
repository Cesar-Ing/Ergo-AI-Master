import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";

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
        // Enviar datos al backend de FastAPI
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:8000";
        
        const response = await fetch(`${backendUrl}/auth/social`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            full_name: user.name || "Usuario OAuth",
            provider: account?.provider || "unknown"
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Guardamos el token que FastAPI nos devuelve en el objeto user de NextAuth
          (user as any).backendToken = data.access_token;
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("Error connecting to backend during OAuth:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Pasa el token de FastAPI a la sesión JWT de NextAuth
      if (user && (user as any).backendToken) {
        token.backendToken = (user as any).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Pone el token de FastAPI en la sesión para que el cliente lo use
      if (token.backendToken) {
        (session as any).backendToken = token.backendToken;
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
