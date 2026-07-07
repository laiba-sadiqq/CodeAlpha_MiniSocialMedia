import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User, Post, Comment } from './models.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found. Please check your backend/.env file.');
  process.exit(1);
}

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Clearing existing data...');

    // Clear collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});

    console.log('Generating password hashes...');
    const salt = await bcrypt.genSalt(10);
    const commonPasswordHash = await bcrypt.hash('password123', salt);

    console.log('Seeding users...');
    const usersData = [
      {
        username: 'sarah_codes',
        email: 'sarah@example.com',
        passwordHash: commonPasswordHash,
        displayName: 'Sarah Jenkins',
        bio: 'Senior Frontend Developer. Building accessible & beautiful user interfaces with React, Tailwind & Vite. ☕ Coffee powered.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
      },
      {
        username: 'alex_design',
        email: 'alex@example.com',
        passwordHash: commonPasswordHash,
        displayName: 'Alex Mercer',
        bio: 'Product Designer & Visual Artist. Finding beauty in grid layouts, clean typography, and minimalist UI systems.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
      },
      {
        username: 'elena_writes',
        email: 'elena@example.com',
        passwordHash: commonPasswordHash,
        displayName: 'Elena Rostova',
        bio: 'Technical Writer & Content Strategist. Simplifying complex software architectures into delightful human stories.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'
      },
      {
        username: 'marcus_dev',
        email: 'marcus@example.com',
        passwordHash: commonPasswordHash,
        displayName: 'Marcus Vance',
        bio: 'Backend Systems Engineer. Passionate about database optimization, WebSockets, and building robust microservices.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
      }
    ];

    const createdUsers = await User.insertMany(usersData);
    const [sarah, alex, elena, marcus] = createdUsers;

    console.log('Setting up follow relationships...');
    // Sarah follows Alex and Elena
    sarah.following.push(alex._id, elena._id);
    alex.followers.push(sarah._id);
    elena.followers.push(sarah._id);

    // Alex follows Sarah and Marcus
    alex.following.push(sarah._id, marcus._id);
    sarah.followers.push(alex._id);
    marcus.followers.push(alex._id);

    // Elena follows Sarah, Alex, and Marcus
    elena.following.push(sarah._id, alex._id, marcus._id);
    sarah.followers.push(elena._id);
    alex.followers.push(elena._id);
    marcus.followers.push(elena._id);

    // Marcus follows Sarah
    marcus.following.push(sarah._id);
    sarah.followers.push(marcus._id);

    await Promise.all([sarah.save(), alex.save(), elena.save(), marcus.save()]);

    console.log('Seeding posts...');
    const postsData = [
      {
        userId: sarah._id,
        content: 'Just deployed the new landing page for my open-source UI library. Designed in Figma by @alex_design, and coded using Tailwind CSS v4. Check out this smooth glassmorphism header! What do you guys think?',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        likes: [alex._id, elena._id]
      },
      {
        userId: alex._id,
        content: 'Spent the morning experimenting with a new dark-mode dashboard color palette. HSL 224, 71%, 4% for the background, accented with bright violet. It feels incredibly premium and easy on the eyes. Screen mockup incoming!',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        likes: [sarah._id, marcus._id, elena._id]
      },
      {
        userId: elena._id,
        content: 'I wrote a comprehensive guide on "How to Write Technical Documentation Developers Actually Want to Read". It covers clear code examples, structured headings, and keeping things short and readable. Link in bio!',
        imageUrl: '',
        likes: [sarah._id, marcus._id]
      },
      {
        userId: marcus._id,
        content: 'Just ran a load test on our new Express + MongoDB cluster. Optimizing indexes reduced query latency by 85%! Remember, kids: never run queries without profiling your explain plans first.',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        likes: [sarah._id, alex._id]
      }
    ];

    const createdPosts = await Post.insertMany(postsData);
    const [sarahPost, alexPost, elenaPost, marcusPost] = createdPosts;

    console.log('Seeding comments...');
    const commentsData = [
      // Comments on Sarah's post
      {
        postId: sarahPost._id,
        userId: alex._id,
        content: 'It turned out absolutely gorgeous in code! Love the subtle border gradients. 🔥'
      },
      {
        postId: sarahPost._id,
        userId: elena._id,
        content: 'This glassmorphism look is extremely modern and professional. I would read a documentation site styled like this any day!'
      },
      {
        postId: sarahPost._id,
        userId: sarah._id,
        content: 'Thanks both! Ready to push to production soon.'
      },
      // Comments on Alex's post
      {
        postId: alexPost._id,
        userId: sarah._id,
        content: 'That violet accent pops so well! Can you share the exact HSL code for the accent?'
      },
      {
        postId: alexPost._id,
        userId: alex._id,
        content: '@sarah_codes Sure! It is hsl(263, 90%, 65%).'
      },
      // Comments on Elena's post
      {
        postId: elenaPost._id,
        userId: marcus._id,
        content: 'As a backend developer who hates long documentation, thank you! Keeping articles straight to the point is key.'
      },
      // Comments on Marcus's post
      {
        postId: marcusPost._id,
        userId: sarah._id,
        content: '85% reduction is massive! Did you have to create compound indexes?'
      },
      {
        postId: marcusPost._id,
        userId: marcus._id,
        content: '@sarah_codes Yes! Specifically on the userId + createdAt fields since we sort by date for user profiles.'
      }
    ];

    await Comment.insertMany(commentsData);

    console.log('Database successfully seeded with realistic, real-life demo data!');
    console.log('Use username: "sarah_codes", "alex_design", "elena_writes", or "marcus_dev" with password: "password123" to log in.');

    await mongoose.disconnect();
    console.log('Disconnected from database.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();