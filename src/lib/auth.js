import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getAuth
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { auth, db, firebaseConfig } from "./firebase";

export function getFriendlyErrorMessage(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const msg = typeof err === 'string' ? err : (err.message || err.code || '');
  
  if (msg.includes('auth/email-already-in-use')) {
    return 'This email address is already registered to another client.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
    return 'Invalid email address or password.';
  }

  return msg
    .replace(/^Firebase:\s*/i, '')
    .replace(/Error\s*\(auth\/[^\)]+\):?\s*/i, '')
    .replace(/\(auth\/[^\)]+\)/i, '')
    .trim() || 'An error occurred while processing request.';
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (uid, email) => {
  try {
    const userDoc = await getDoc(doc(db, "Users", uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    if (email) {
      const { collection, query, where, getDocs, setDoc: firestoreSetDoc } = await import("firebase/firestore");
      const q = query(collection(db, "Users"), where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const foundDoc = snap.docs[0];
        const data = foundDoc.data();
        const mergedData = { ...data, uid, id: uid };
        await firestoreSetDoc(doc(db, "Users", uid), mergedData, { merge: true });
        return mergedData;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const registerUser = async (emailOrData, passwordParam, userDataParam) => {
  try {
    let email, password, userData;
    if (typeof emailOrData === 'object') {
      email = emailOrData.email;
      password = emailOrData.password;
      userData = emailOrData;
    } else {
      email = emailOrData;
      password = passwordParam;
      userData = userDataParam;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const role = userData?.role || (email.toLowerCase().includes('admin') ? 'admin' : 'client');
    
    await setDoc(doc(db, "Users", user.uid), {
      displayName: userData?.name || userData?.displayName || email.split('@')[0],
      phone: userData?.phone || '',
      ...userData,
      uid: user.uid,
      id: user.uid,
      email: user.email,
      role: role,
      status: 'active',
      createdAt: serverTimestamp(),
    });
    
    return { ...user, role };
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const registerUserByAdmin = async (clientData) => {
  const email = clientData.email;
  const password = clientData.password || 'client123';
  let uid = '';

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    const secondaryApp = getApps().find(app => app.name === 'SecondaryAdminAuth') 
      || initializeApp(firebaseConfig, 'SecondaryAdminAuth');
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    uid = userCredential.user.uid;
  } catch (authErr) {
    console.warn('Firebase Auth creation notice:', authErr);
    if (authErr.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered to a client.');
    }
    if (authErr.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (authErr.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    uid = `client_${Date.now()}`;
  }

  const newUserData = {
    displayName: clientData.name || clientData.displayName || email.split('@')[0],
    name: clientData.name || clientData.displayName || '',
    phone: clientData.phone || '',
    age: clientData.age || '',
    gender: clientData.gender || 'Male',
    email: email,
    uid: uid,
    id: uid,
    role: 'client',
    status: 'active',
    clientCode: clientData.clientCode || `100`,
    ...clientData,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "Users", uid), newUserData);
  return { id: uid, ...newUserData };
};

export const loginUser = async (email, password) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getFriendlyErrorMessage(error));
  }
};
