import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

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
    
    // Auto detect admin role if specified or if email contains 'admin'
    const role = userData?.role || (email.toLowerCase().includes('admin') ? 'admin' : 'client');
    
    // Create user document in Firestore
    await setDoc(doc(db, "Users", user.uid), {
      displayName: userData?.name || userData?.displayName || email.split('@')[0],
      phone: userData?.phone || '',
      ...userData,
      uid: user.uid,
      email: user.email,
      role: role,
      status: 'active',
      createdAt: serverTimestamp(),
    });
    
    return { ...user, role };
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "Users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
