import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const plansData = [
  {"plan_name": "One Hour Pass", "category": "Quick Workout", "description": "Quick access pass for a single continuous 1-hour workout session.", "pricing": [{"durationVal": 1, "durationUnit": "Days", "duration": "1 Day", "price": 10}], "features": ["Access to gym equipment for 1 hour", "Cardio and strength training access", "Locker access (if available)", "Clean and hygienic workout environment", "Valid only for one continuous 1-hour session", "One person only", "Non-transferable", "No trainer included (unless purchased separately)"]},
  {"plan_name": "Daily Pass", "category": "PowerHouse Fitness", "description": "Perfect for visitors, travelers, or anyone wanting to experience PowerHouse Gym for a day.", "pricing": [{"durationVal": 1, "durationUnit": "Days", "duration": "1 Day", "price": 99}], "features": ["Full Gym Access", "Cardio Zone", "Strength Training", "Modern Equipment", "Clean Locker Facility", "Trainer Assistance"]},
  {"plan_name": "Strength Training", "category": "PowerHouse Fitness", "description": "Focus on muscle building, strength development, and professional weight training.", "pricing": [{"durationVal": 1, "durationUnit": "Months", "duration": "1 Month", "price": 1299}, {"durationVal": 2, "durationUnit": "Months", "duration": "2 Months", "price": 2199}, {"durationVal": 3, "durationUnit": "Months", "duration": "3 Months", "price": 2999}, {"durationVal": 6, "durationUnit": "Months", "duration": "6 Months", "price": 5499}], "features": ["Modern Equipment", "Strength Training", "Certified Trainers", "Weight Training", "Locker Facility"]},
  {"plan_name": "Cardio + Strength", "category": "PowerHouse Fitness", "badge": "Most Popular", "description": "The ultimate combination for fat loss, endurance, and body transformation.", "pricing": [{"durationVal": 1, "durationUnit": "Months", "duration": "1 Month", "price": 1599}, {"durationVal": 2, "durationUnit": "Months", "duration": "2 Months", "price": 2699}, {"durationVal": 3, "durationUnit": "Months", "duration": "3 Months", "price": 3999}, {"durationVal": 6, "durationUnit": "Months", "duration": "6 Months", "price": 6499}, {"durationVal": 12, "durationUnit": "Months", "duration": "12 Months", "price": 9999}], "features": ["Cardio", "Strength Training", "Weight Loss", "Muscle Gain", "Trainer Guidance"]},
  {"plan_name": "Personal Training", "category": "PowerHouse Fitness", "description": "One-on-one coaching with personalized workout and nutrition guidance.", "pricing": [{"durationVal": 1, "durationUnit": "Months", "duration": "1 Month", "price": 6000}, {"durationVal": 3, "durationUnit": "Months", "duration": "3 Months", "price": 16000}, {"durationVal": 6, "durationUnit": "Months", "duration": "6 Months", "price": 30000}, {"durationVal": 1, "durationUnit": "Years", "duration": "1 Year", "price": 50000}], "features": ["Personal Trainer", "Diet Plan", "Workout Plan", "Progress Tracking", "Nutrition Guidance"]},
  {"plan_name": "15 Days Pass", "category": "PowerHouse Fitness", "description": "A flexible short-term membership for beginners and fitness enthusiasts.", "pricing": [{"durationVal": 15, "durationUnit": "Days", "duration": "15 Days", "price": 999}], "features": ["Unlimited Gym Access", "Cardio & Strength Training", "Certified Trainer Support", "Weight Loss & Muscle Gain Guidance", "Locker Facility", "Clean & Hygienic Environment"]}
];

const dietTemplatesData = [
  {
    templateName: "High Protein Fat Loss (1800 Kcal)",
    description: "Designed for rapid fat burning while retaining lean muscle mass with high protein intake.",
    totals: { calories: 1800, protein: 160, carbs: 140, fat: 50 },
    mealsState: {
      breakfast: { foods: [{ name: "Egg White Omelette + Whole Grain Toast", qty: "4 Eggs + 2 Slices", calories: 350, protein: 28, carbs: 30, fat: 8 }], instructions: "Cook eggs with minimal olive oil." },
      preWorkout: { foods: [{ name: "Black Coffee + 1 Banana", qty: "1 Cup + 1 Fruit", calories: 110, protein: 1, carbs: 27, fat: 0 }], instructions: "Consume 30 mins before workout." },
      postWorkout: { foods: [{ name: "Whey Protein Isolate Shake", qty: "1 Scoop in Water", calories: 140, protein: 28, carbs: 2, fat: 1 }], instructions: "Consume immediately after training." },
      lunch: { foods: [{ name: "Grilled Chicken Breast with Brown Rice & Broccoli", qty: "200g + 1 Cup", calories: 600, protein: 55, carbs: 50, fat: 12 }], instructions: "Season with herbs and lemon." },
      dinner: { foods: [{ name: "Steamed Salmon / Paneer Salad with Olive Oil", qty: "1 Bowl", calories: 600, protein: 48, carbs: 31, fat: 29 }], instructions: "Eat light dinner at least 2 hours before sleep." }
    }
  },
  {
    templateName: "Hypertrophy Muscle Gain (2600 Kcal)",
    description: "High calorie & nutrient-dense plan engineered for maximum muscle hypertrophy and strength.",
    totals: { calories: 2600, protein: 185, carbs: 310, fat: 65 },
    mealsState: {
      breakfast: { foods: [{ name: "Oats with Almond Butter, Banana & Protein Powder", qty: "1 Large Bowl", calories: 650, protein: 40, carbs: 85, fat: 15 }], instructions: "Mix well with warm water/almond milk." },
      preWorkout: { foods: [{ name: "Rice Cakes with Peanut Butter & Honey", qty: "3 Cakes", calories: 280, protein: 8, carbs: 42, fat: 9 }], instructions: "Eat 45 mins before heavy lifting." },
      postWorkout: { foods: [{ name: "Whey Protein + 1 Dextrose/Banana", qty: "1 Scoop + 1 Fruit", calories: 250, protein: 30, carbs: 30, fat: 2 }], instructions: "Refuel muscle glycogen immediately." },
      lunch: { foods: [{ name: "Lean Beef / Chicken with Sweet Potato & Green Beans", qty: "250g + 200g", calories: 750, protein: 60, carbs: 80, fat: 18 }], instructions: "Include healthy veggies." },
      dinner: { foods: [{ name: "Whole Eggs + Quinoa & Mixed Veggie Stir Fry", qty: "3 Eggs + 1 Bowl", calories: 670, protein: 47, carbs: 73, fat: 21 }], instructions: "Drink plenty of water with dinner." }
    }
  }
];

const workoutTemplatesData = [
  {
    templateName: "Push Day Strength (5 Exercises)",
    description: "Strength-focused chest, shoulders, and triceps workout template.",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "6-8", weight: "80 kg", rest: "120s", notes: "Focus on controlled eccentric phase" },
      { name: "Overhead Barbell Press", sets: 3, reps: "8-10", weight: "50 kg", rest: "90s", notes: "Keep core engaged, no leaning back" },
      { name: "Incline Dumbbell Flyes", sets: 3, reps: "10-12", weight: "22 kg", rest: "90s", notes: "Squeeze chest at the top peak contraction" },
      { name: "Dumbbell Lateral Raises", sets: 4, reps: "12-15", weight: "12 kg", rest: "60s", notes: "Maintain slight forward lean" },
      { name: "Tricep Overhead Extensions", sets: 3, reps: "10-12", weight: "30 kg", rest: "60s", notes: "Keep elbows tucked in close" }
    ]
  },
  {
    templateName: "Pull Day Hypertrophy (5 Exercises)",
    description: "Upper back, lats, rear delts, and biceps hypertrophy routine.",
    exercises: [
      { name: "Deadlift (Conventional)", sets: 3, reps: "5", weight: "120 kg", rest: "150s", notes: "Keep neutral spine throughout pull" },
      { name: "Lat Pulldown (Wide Grip)", sets: 4, reps: "8-10", weight: "65 kg", rest: "90s", notes: "Pull with elbows down to hip pocket" },
      { name: "One Arm Dumbbell Rows", sets: 3, reps: "10", weight: "35 kg", rest: "90s", notes: "Drive elbows back, stretch at bottom" },
      { name: "Face Pulls (Cable)", sets: 4, reps: "15", weight: "20 kg", rest: "60s", notes: "Hold contraction for 1 second at back" },
      { name: "Incline Dumbbell Bicep Curls", sets: 3, reps: "10-12", weight: "14 kg", rest: "60s", notes: "Full stretch at bottom of rep" }
    ]
  }
];

export const seedPlans = async () => {
  try {
    const plansCollection = collection(db, "Plans");
    const snapshot = await getDocs(plansCollection);
    
    if (snapshot.empty) {
      console.log("No plans found. Seeding plans...");
      for (const plan of plansData) {
        await addDoc(plansCollection, {
          ...plan,
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
      console.log("Plans seeded successfully!");
    }

    const templatesCollection = collection(db, "DietTemplates");
    const tempSnapshot = await getDocs(templatesCollection);
    if (tempSnapshot.empty) {
      console.log("Seeding Diet Templates...");
      for (const tmpl of dietTemplatesData) {
        await addDoc(templatesCollection, {
          ...tmpl,
          createdAt: serverTimestamp()
        });
      }
      console.log("Diet Templates seeded!");
    }

    const workoutTemplatesCollection = collection(db, "WorkoutTemplates");
    const wTempSnapshot = await getDocs(workoutTemplatesCollection);
    if (wTempSnapshot.empty) {
      console.log("Seeding Workout Templates...");
      for (const tmpl of workoutTemplatesData) {
        await addDoc(workoutTemplatesCollection, {
          ...tmpl,
          createdAt: serverTimestamp()
        });
      }
      console.log("Workout Templates seeded!");
    }
  } catch (error) {
    console.error("Error seeding plans:", error);
  }
};
