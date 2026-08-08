import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

// Generic operations
export const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getDocument = async (collectionName, docId) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const getDocuments = async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateDocument = async (collectionName, docId, data) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteDocument = async (collectionName, docId) => {
  await deleteDoc(doc(db, collectionName, docId));
};

export const queryDocuments = async (collectionName, conditions = [], orderByField, orderDirection = "asc", limitCount) => {
  let q = collection(db, collectionName);
  
  if (conditions.length > 0) {
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });
  }
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Plans
export const getPlans = () => getDocuments("Plans");
export const getPlanById = (planId) => getDocument("Plans", planId);
export const createPlan = (planData) => addDocument("Plans", planData);
export const updatePlan = (planId, planData) => updateDocument("Plans", planId, planData);

// ClientPlans
export const assignPlan = (clientPlanData) => addDocument("ClientPlans", clientPlanData);
export const getClientPlan = (clientPlanId) => getDocument("ClientPlans", clientPlanId);
export const getClientPlans = (clientId) => queryDocuments("ClientPlans", [{ field: "clientId", operator: "==", value: clientId }]);

// Diet Templates
export const createDietTemplate = (data) => addDocument("DietTemplates", data);
export const getDietTemplates = () => getDocuments("DietTemplates");
export const updateDietTemplate = (id, data) => updateDocument("DietTemplates", id, data);
export const deleteDietTemplate = (id) => deleteDocument("DietTemplates", id);

// DietPlans
export const createDietPlan = (dietPlanData) => addDocument("DietPlans", dietPlanData);
export const getDietPlan = (planId) => getDocument("DietPlans", planId);
export const getClientDietPlan = async (clientId) => {
  const list = await queryDocuments("DietPlans", [{ field: "clientId", operator: "==", value: clientId }]);
  if (list.length === 0) return null;
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
};
export const getClientDietPlans = async (clientId) => {
  const list = await queryDocuments("DietPlans", [{ field: "clientId", operator: "==", value: clientId }]);
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};
export const updateDietPlan = (planId, data) => updateDocument("DietPlans", planId, data);
export const deleteDietPlan = (planId) => deleteDocument("DietPlans", planId);

// Workout Templates
export const createWorkoutTemplate = (data) => addDocument("WorkoutTemplates", data);
export const getWorkoutTemplates = () => getDocuments("WorkoutTemplates");
export const updateWorkoutTemplate = (id, data) => updateDocument("WorkoutTemplates", id, data);
export const deleteWorkoutTemplate = (id) => deleteDocument("WorkoutTemplates", id);

// WorkoutPlans
export const createWorkoutPlan = (workoutPlanData) => addDocument("WorkoutPlans", workoutPlanData);
export const getWorkoutPlan = (planId) => getDocument("WorkoutPlans", planId);
export const getClientWorkoutPlan = async (clientId) => {
  const list = await queryDocuments("WorkoutPlans", [{ field: "clientId", operator: "==", value: clientId }]);
  if (list.length === 0) return null;
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
};
export const getClientWorkoutPlans = async (clientId) => {
  const list = await queryDocuments("WorkoutPlans", [{ field: "clientId", operator: "==", value: clientId }]);
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};
export const updateWorkoutPlan = (planId, data) => updateDocument("WorkoutPlans", planId, data);
export const deleteWorkoutPlan = (planId) => deleteDocument("WorkoutPlans", planId);

// DailyLogs
export const submitDailyLog = async (arg1, arg2, arg3) => {
  const clientId = typeof arg1 === 'string' ? arg1 : arg1?.clientId;
  const date = typeof arg2 === 'string' ? arg2 : (arg2?.date || new Date().toISOString().split('T')[0]);
  const logData = typeof arg2 === 'object' ? arg2 : (arg3 || {});

  const docId = `${clientId}_${date}`;
  const docRef = doc(db, "DailyLogs", docId);
  await setDoc(docRef, { 
    ...logData, 
    clientId, 
    date, 
    createdAt: logData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp() 
  }, { merge: true });
  return docId;
};
export const getDailyLog = async (clientId, date) => {
  if (!date) return getDocument("DailyLogs", clientId);
  const docId = `${clientId}_${date}`;
  return getDocument("DailyLogs", docId);
};
export const getClientDailyLogs = async (clientId) => {
  const list = await queryDocuments("DailyLogs", [{ field: "clientId", operator: "==", value: clientId }]);
  return list.sort((a, b) => {
    const timeA = a.createdAt?.seconds || (a.date ? new Date(a.date).getTime() / 1000 : 0);
    const timeB = b.createdAt?.seconds || (b.date ? new Date(b.date).getTime() / 1000 : 0);
    return timeB - timeA;
  });
};
export const reviewDailyLog = (logId, reviewData) => updateDocument("DailyLogs", logId, reviewData);

// BodyCheckins
export const submitCheckin = async (arg1, arg2) => {
  const clientId = typeof arg1 === 'string' ? arg1 : arg1?.clientId;
  const checkinData = typeof arg1 === 'object' ? arg1 : (arg2 || {});

  const dataToSave = {
    ...checkinData,
    clientId: clientId || checkinData.clientId || '',
    date: checkinData.date || new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  return addDocument("BodyCheckins", dataToSave);
};
export const getClientCheckins = async (clientId) => {
  const list = await queryDocuments("BodyCheckins", [{ field: "clientId", operator: "==", value: clientId }]);
  return list.sort((a, b) => {
    const timeA = a.createdAt?.seconds || (a.date ? new Date(a.date).getTime() / 1000 : 0);
    const timeB = b.createdAt?.seconds || (b.date ? new Date(b.date).getTime() / 1000 : 0);
    return timeB - timeA;
  });
};
export const getClientMeasurements = getClientCheckins;
export const getCheckinById = (checkinId) => getDocument("BodyCheckins", checkinId);
export const updateCheckin = (id, data) => updateDocument("BodyCheckins", id, data);
export const deleteCheckin = (id) => deleteDocument("BodyCheckins", id);

// BloodReports
export const uploadBloodReport = (reportData) => addDocument("BloodReports", reportData);
export const getClientBloodReports = async (clientId) => {
  const list = await queryDocuments("BloodReports", [{ field: "clientId", operator: "==", value: clientId }]);
  return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};
export const updateBloodReport = (id, data) => updateDocument("BloodReports", id, data);
export const deleteBloodReport = (id) => deleteDocument("BloodReports", id);

// Notifications
export const createNotification = (notificationData) => addDocument("Notifications", notificationData);
export const getClientNotifications = async (clientId) => {
  const allNotifs = await getDocuments("Notifications");
  const filtered = (allNotifs || []).filter(n => 
    n.recipient === 'all' || 
    n.recipient === clientId || 
    n.userId === clientId
  );
  return filtered.sort((a, b) => {
    const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.sentAt ? new Date(a.sentAt).getTime() : 0);
    const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.sentAt ? new Date(b.sentAt).getTime() : 0);
    return tB - tA;
  });
};
export const markAsRead = (notificationId) => updateDocument("Notifications", notificationId, { read: true });
export const deleteNotification = (notificationId) => deleteDocument("Notifications", notificationId);

// Users
export const getAllClients = () => queryDocuments("Users", [{ field: "role", operator: "==", value: "client" }]);
export const getClientById = (clientId) => getDocument("Users", clientId);
export const updateClientProfile = (clientId, profileData) => updateDocument("Users", clientId, profileData);
export const deleteClient = (clientId) => deleteDocument("Users", clientId);

// Enquiries (Web Submissions & Walk-ins)
export const addEnquiry = (data) => addDocument("Enquiries", {
  status: 'new',
  source: 'walkin',
  createdAt: new Date().toISOString(),
  ...data
});

export const getEnquiries = async () => {
  const list = await getDocuments("Enquiries");
  return (list || []).sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });
};

export const updateEnquiry = (id, data) => updateDocument("Enquiries", id, data);
export const deleteEnquiry = (id) => deleteDocument("Enquiries", id);

export const clearSeedClients = async () => {
  const seedEmails = [
    'teja@powerhouse.com',
    'client@powerhouse.com',
    'rajesh@powerhouse.com',
    'raghava@powerhouse.com',
    'durga@powerhouse.com',
    'satish@powerhouse.com',
    'ganesh@powerhouse.com'
  ];
  const allUsers = await getAllClients();
  let count = 0;
  for (const user of allUsers) {
    if (seedEmails.includes(user.email?.toLowerCase()) || user.id === 'demo-client-id') {
      await deleteDocument("Users", user.id);
      count++;
    }
  }
  return count;
};
