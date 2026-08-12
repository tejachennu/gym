'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid, firebaseUser.email);
          if (!profile) {
            const role = firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'client';
            const newProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: role,
              status: 'active',
              createdAt: new Date().toISOString()
            };
            const { doc, setDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            await setDoc(doc(db, "Users", firebaseUser.uid), newProfile, { merge: true });
            profile = newProfile;
          }
          setUserData(profile);
        } catch (e) {
          console.error("Error setting user profile:", e);
          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: firebaseUser.email?.toLowerCase().includes('admin') ? 'admin' : 'client'
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData) {
        // Redirection based on roles and paths
        if (userData.role === 'admin' && pathname.startsWith('/client')) {
          router.push('/admin');
        } else if (userData.role === 'client' && pathname.startsWith('/admin')) {
          router.push('/client');
        }
      }
    }
  }, [user, userData, loading, router, pathname]);

  if (loading || !user) return <div>Loading...</div>;

  if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
    return <div>Unauthorized access</div>; // Or redirect
  }

  return children;
}
