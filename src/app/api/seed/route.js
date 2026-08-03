import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const plansData = [
  {
    plan_name: "One Hour Pass",
    category: "Quick Workout",
    description: "Quick access pass for a single continuous 1-hour workout session.",
    pricing: [{ duration: "1 Hour", price: 10 }],
    features: [
      "Access to gym equipment for 1 hour",
      "Cardio and strength training access",
      "Locker access (if available)",
      "Clean and hygienic workout environment",
      "Valid only for one continuous 1-hour session",
      "One person only",
      "Non-transferable",
      "No trainer included (unless purchased separately)"
    ],
    status: "active"
  },
  {
    plan_name: "Daily Pass",
    category: "PowerHouse Fitness",
    description: "Perfect for visitors, travelers, or anyone wanting to experience PowerHouse Gym for a day.",
    pricing: [{ duration: "1 Day", price: 99 }],
    features: [
      "Full Gym Access",
      "Cardio Zone",
      "Strength Training",
      "Modern Equipment",
      "Clean Locker Facility",
      "Trainer Assistance"
    ],
    status: "active"
  },
  {
    plan_name: "Strength Training",
    category: "PowerHouse Fitness",
    description: "Focus on muscle building, strength development, and professional weight training.",
    pricing: [
      { duration: "1 Month", price: 1299 },
      { duration: "2 Months", price: 2199 },
      { duration: "3 Months", price: 2999 },
      { duration: "6 Months", price: 5499 }
    ],
    features: [
      "Modern Equipment",
      "Strength Training",
      "Certified Trainers",
      "Weight Training",
      "Locker Facility"
    ],
    status: "active"
  },
  {
    plan_name: "Cardio + Strength",
    category: "PowerHouse Fitness",
    badge: "Most Popular",
    description: "The ultimate combination for fat loss, endurance, and body transformation.",
    pricing: [
      { duration: "1 Month", price: 1599 },
      { duration: "2 Months", price: 2699 },
      { duration: "3 Months", price: 3999 },
      { duration: "6 Months", price: 6499 },
      { duration: "12 Months", price: 9999 }
    ],
    features: [
      "Cardio",
      "Strength Training",
      "Weight Loss",
      "Muscle Gain",
      "Trainer Guidance"
    ],
    status: "active"
  },
  {
    plan_name: "Personal Training",
    category: "PowerHouse Fitness",
    description: "One-on-one coaching with personalized workout and nutrition guidance.",
    pricing: [
      { duration: "1 Month", price: 6000 },
      { duration: "3 Months", price: 16000 },
      { duration: "6 Months", price: 30000 },
      { duration: "1 Year", "price": 50000 }
    ],
    features: [
      "Personal Trainer",
      "Diet Plan",
      "Workout Plan",
      "Progress Tracking",
      "Nutrition Guidance"
    ],
    status: "active"
  },
  {
    plan_name: "15 Days Pass",
    category: "PowerHouse Fitness",
    description: "A flexible short-term membership for beginners and fitness enthusiasts.",
    pricing: [{ duration: "15 Days", price: 999 }],
    features: [
      "Unlimited Gym Access",
      "Cardio & Strength Training",
      "Certified Trainer Support",
      "Weight Loss & Muscle Gain Guidance",
      "Locker Facility",
      "Clean & Hygienic Environment"
    ],
    status: "active"
  }
];

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    const results = {
      plansSeeded: 0,
      dietPlansSeeded: 0,
      workoutPlansSeeded: 0,
      dailyLogsSeeded: 0,
      checkinsSeeded: 0,
      bloodReportsSeeded: 0,
      notificationsSeeded: 0
    };

    // 1. Seed Membership Plans if empty
    const plansRef = collection(db, "Plans");
    const plansSnap = await getDocs(plansRef);
    if (plansSnap.empty) {
      for (const p of plansData) {
        await addDoc(plansRef, { ...p, createdAt: serverTimestamp() });
        results.plansSeeded++;
      }
    } else {
      results.plansSeeded = plansSnap.size;
    }

    // 2. Seed Sample Diet Plan
    const dietRef = collection(db, "DietPlans");
    const dietSnap = await getDocs(dietRef);
    if (dietSnap.empty) {
      await addDoc(dietRef, {
        clientId: "demo-client-id",
        clientName: "John Fitness Client",
        planName: "Hypertrophy High-Protein Diet",
        meals: [
          { slot: "Morning", foods: "Warm Water + Lemon, 5 Almonds", quantity: "1 Glass", calories: 60, protein: 2, carbs: 4, fat: 4, instructions: "Drink immediately after waking up" },
          { slot: "Breakfast", foods: "Oats with Whey Protein, Banana, Peanut Butter", quantity: "1 Bowl", calories: 450, protein: 32, carbs: 55, fat: 12, instructions: "Consume within 30 mins after workout" },
          { slot: "Mid Meal", foods: "Greek Yogurt with Mixed Berries", quantity: "200g", calories: 150, protein: 15, carbs: 18, fat: 2, instructions: "Healthy snack" },
          { slot: "Lunch", foods: "Grilled Chicken Breast, Brown Rice, Steamed Broccoli", quantity: "200g Chicken + 1 Cup Rice", calories: 550, protein: 48, carbs: 60, fat: 8, instructions: "Low sodium" },
          { slot: "Evening Snack", foods: "Boiled Eggs (4 Whites + 1 Whole)", quantity: "5 Eggs", calories: 180, protein: 24, carbs: 2, fat: 6, instructions: "Salt and black pepper to taste" },
          { slot: "Pre Workout", foods: "Black Coffee + 1 Apple", quantity: "1 Cup", calories: 80, protein: 1, carbs: 20, fat: 0, instructions: "Consume 30 mins before workout" },
          { slot: "Post Workout", foods: "Whey Protein Isolate Scoop", quantity: "1 Scoop (30g)", calories: 120, protein: 25, carbs: 2, fat: 1, instructions: "Mix with water" },
          { slot: "Dinner", foods: "Paneer / Tofu Tikka, Green Salad, Multigrain Roti", quantity: "150g Paneer + 2 Rotis", calories: 480, protein: 28, carbs: 45, fat: 18, instructions: "Eat at least 2 hours before sleep" },
          { slot: "Before Bed", foods: "Warm Milk with Turmeric", quantity: "1 Glass (200ml)", calories: 130, protein: 8, carbs: 10, fat: 6, instructions: "Promotes deep sleep recovery" }
        ],
        createdAt: serverTimestamp()
      });
      results.dietPlansSeeded++;
    }

    // 3. Seed Sample Workout Plan
    const workoutRef = collection(db, "WorkoutPlans");
    const workoutSnap = await getDocs(workoutRef);
    if (workoutSnap.empty) {
      await addDoc(workoutRef, {
        clientId: "demo-client-id",
        clientName: "John Fitness Client",
        planName: "Push Pull Legs Strength Routine",
        exercises: [
          { name: "Barbell Bench Press", sets: 4, reps: "8-10", weight: "75 kg", restTime: "90s", notes: "Focus on slow eccentric motion" },
          { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", weight: "26 kg", restTime: "60s", notes: "Squeeze chest at peak contraction" },
          { name: "Barbell Squats", sets: 4, reps: "6-8", weight: "100 kg", restTime: "120s", notes: "Keep spine neutral and drop parallel" },
          { name: "Romanian Deadlifts", sets: 3, reps: "10", weight: "80 kg", restTime: "90s", notes: "Hinge at hips, stretch hamstrings" },
          { name: "Overhead Barbell Press", sets: 3, reps: "8", weight: "50 kg", restTime: "90s", notes: "Strict form, avoid arching back" }
        ],
        createdAt: serverTimestamp()
      });
      results.workoutPlansSeeded++;
    }

    // 4. Seed Sample Blood Report
    const bloodRef = collection(db, "BloodReports");
    const bloodSnap = await getDocs(bloodRef);
    if (bloodSnap.empty) {
      await addDoc(bloodRef, {
        clientId: "demo-client-id",
        clientName: "John Fitness Client",
        testDate: "2026-07-28",
        testName: "Complete Blood Count & Vitamin Profile",
        description: "Routine quarterly health panel review",
        abnormalities: "Vitamin D3 is slightly low (22 ng/mL). Vitamin B12 and Lipid Profile are within healthy range.",
        reportUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        uploadedBy: "PowerHouse Admin",
        uploadedAt: serverTimestamp()
      });
      results.bloodReportsSeeded++;
    }

    // 5. Seed Sample Notification
    const notifRef = collection(db, "Notifications");
    const notifSnap = await getDocs(notifRef);
    if (notifSnap.empty) {
      await addDoc(notifRef, {
        userId: "demo-client-id",
        title: "Daily Check-in Reminder 📸",
        message: "Time for your 10-day body transformation photo check-in! Please upload your 4-angle photos.",
        type: "reminder",
        read: false,
        createdAt: serverTimestamp()
      });
      results.notificationsSeeded++;
    }

    return NextResponse.json({
      success: true,
      message: "API verification & data seeding completed successfully!",
      results
    });
  } catch (error) {
    console.error("API Seed Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
