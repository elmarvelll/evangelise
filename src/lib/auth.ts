import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google"
import { findOrCreateGoogleUser, findUserByEmail, verifyCredentials } from "@/services/auth.service";

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET!,

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },

    providers: [
        CredentialsProvider({
            name: "Credentials",

            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                },
                password: {
                    label: "Password",
                    type: "password",
                },
            },

            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await verifyCredentials(email, password);

                if (!user) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                };
            },

        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user?.email) {
                const dbUser = await findUserByEmail(user.email.toLowerCase());

                if (dbUser) {
                    token.id = dbUser.id;
                    token.email = dbUser.email;
                    token.name = `${dbUser.firstName} ${dbUser.lastName}`;
                }
            }
                         return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const email = user.email?.trim().toLowerCase();
                if (!email) return false;

                await findOrCreateGoogleUser(email, user.name);
            }

            return true;
        }
    },
};