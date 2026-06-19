const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Member = require('./models/Member');
const WorkoutSchedule = require('./models/WorkoutSchedule');
const DietSchedule = require('./models/DietSchedule');
const Attendance = require('./models/Attendance');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB. Seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany(), Member.deleteMany(),
    WorkoutSchedule.deleteMany(), DietSchedule.deleteMany(), Attendance.deleteMany(),
  ]);

  // Create admin
  const admin = await User.create({ name: 'Alex Carter', email: 'admin@gym.com', password: 'Admin@123', role: 'admin' });
  console.log('✅ Admin created: admin@gym.com / Admin@123');

  // Create athletes
  const athleteData = [
    { name: 'Jordan Smith', email: 'jordan@gym.com', password: 'Gym@1234', phone: '9876543210', membershipType: 'premium', daysOffset: 90 },
    { name: 'Maya Patel', email: 'maya@gym.com', password: 'Gym@1234', phone: '9876543211', membershipType: 'standard', daysOffset: 30 },
    { name: 'Chris Lee', email: 'chris@gym.com', password: 'Gym@1234', phone: '9876543212', membershipType: 'basic', daysOffset: -5 },
  ];

  const athletes = [];
  for (const a of athleteData) {
    const user = await User.create({ name: a.name, email: a.email, password: a.password, role: 'athlete' });
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + a.daysOffset);
    const member = await Member.create({
      userId: user._id,
      phone: a.phone,
      membershipType: a.membershipType,
      enrollmentDate: new Date(),
      expiryDate: expiry,
      status: a.daysOffset > 0 ? 'active' : 'expired',
      gender: 'male',
      goals: 'Build muscle and improve endurance',
    });
    athletes.push({ user, member });
    console.log(`✅ Athlete created: ${a.email} / ${a.password}`);
  }

  // Seed workout for first athlete
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workoutDays = DAYS.map((day, i) => ({
    dayName: day,
    isRestDay: i === 6,
    focus: ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders', 'Full Body', 'Cardio', 'Rest'][i],
    exercises: i === 6 ? [] : [
      { name: 'Bench Press', sets: 4, reps: '8-10', rest: '90s' },
      { name: 'Pull Ups', sets: 3, reps: '10-12', rest: '60s' },
      { name: 'Squats', sets: 4, reps: '10', rest: '90s' },
    ],
  }));

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const currentWeek = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

  await WorkoutSchedule.create({
    userId: athletes[0].user._id,
    week: currentWeek,
    year: now.getFullYear(),
    days: workoutDays,
    notes: 'Focus on progressive overload. Rest 48h between muscle groups.',
    assignedBy: admin._id,
  });

  // Seed diet for first athlete
  const dietDays = DAYS.map((day) => ({
    dayName: day,
    targetCalories: 2400,
    waterIntake: '3.5L',
    meals: [
      { type: 'breakfast', time: '7:00 AM', foods: [{ name: 'Oats with banana', quantity: '100g', calories: 350, protein: 12, carbs: 60, fat: 6 }], totalCalories: 350 },
      { type: 'lunch', time: '1:00 PM', foods: [{ name: 'Chicken breast + rice', quantity: '250g', calories: 550, protein: 45, carbs: 60, fat: 10 }], totalCalories: 550 },
      { type: 'dinner', time: '7:30 PM', foods: [{ name: 'Grilled salmon + veggies', quantity: '300g', calories: 450, protein: 40, carbs: 20, fat: 18 }], totalCalories: 450 },
      { type: 'post-workout', time: '6:00 PM', foods: [{ name: 'Whey protein shake', quantity: '30g', calories: 120, protein: 25, carbs: 5, fat: 2 }], totalCalories: 120 },
    ],
  }));

  await DietSchedule.create({
    userId: athletes[0].user._id,
    week: currentWeek,
    year: now.getFullYear(),
    days: dietDays,
    notes: 'High protein diet. Drink plenty of water.',
    assignedBy: admin._id,
  });

  // Seed attendance for first athlete (last 14 days)
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0) continue; // Skip Sundays
    const statuses = ['present', 'present', 'present', 'late', 'absent'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    await Attendance.create({
      userId: athletes[0].user._id,
      date: d,
      status,
      reason: status === 'absent' ? 'Fever' : status === 'late' ? 'Traffic' : '',
      checkInTime: status !== 'absent' ? '6:30 AM' : '',
    });
  }

  console.log('🌱 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:   admin@gym.com / Admin@123');
  console.log('  Athlete: jordan@gym.com / Gym@1234');
  console.log('  Athlete: maya@gym.com / Gym@1234');
  console.log('  Athlete: chris@gym.com / Gym@1234');
  mongoose.connection.close();
};

seed().catch((err) => { console.error(err); mongoose.connection.close(); });
