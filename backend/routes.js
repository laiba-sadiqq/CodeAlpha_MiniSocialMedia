import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Post, Comment } from './models.js';
import { authMiddleware } from './middleware/auth.js';

const router = express.Router();

// Helper to generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '7d'
  });
};

/* ==========================================================================
   AUTH ROUTES
   ========================================================================== */

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, password and display name are required.' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.toLowerCase(),
      passwordHash,
      displayName,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
    });

    await newUser.save();

    const token = generateToken(newUser._id);

    // Return user without passwordHash
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      displayName: newUser.displayName,
      bio: newUser.bio,
      avatarUrl: newUser.avatarUrl,
      followers: [],
      following: []
    };

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = generateToken(user._id);

    const userResponse = {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followers: user.followers,
      following: user.following
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current User details
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});


/* ==========================================================================
   USER ROUTES
   ========================================================================== */

// Get user profile by username
router.get('/users/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.query.username || req.params.username.toLowerCase() }).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get user's posts
    const posts = await Post.find({ userId: user._id })
      .populate('userId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 });

    res.json({ user, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// Update profile bio/avatar/display name
router.put('/users/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (displayName) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      followers: user.followers,
      following: user.following
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// Toggle follow / unfollow
router.post('/users/follow/:id', authMiddleware, async (req, res) => {
  try {
    const userToFollowId = req.params.id;
    const currentUserId = req.userId;

    if (userToFollowId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const targetUser = await User.findById(userToFollowId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isFollowing = currentUser.following.includes(userToFollowId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== userToFollowId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
    } else {
      // Follow
      currentUser.following.push(userToFollowId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
      currentUserFollowing: currentUser.following
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error processing follow request.' });
  }
});

// Discover Users (suggestions)
router.get('/users/discover', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    // Find users excluding current user and users already followed
    const excludeIds = [currentUser._id, ...currentUser.following];
    const users = await User.find({ _id: { $nin: excludeIds } })
      .select('username displayName avatarUrl bio')
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching discovery users.' });
  }
});


/* ==========================================================================
   POST ROUTES
   ========================================================================== */

// Create Post
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const post = new Post({
      userId: req.userId,
      content,
      imageUrl: imageUrl || ''
    });

    await post.save();

    const populatedPost = await Post.findById(post._id).populate('userId', 'username displayName avatarUrl');

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating post.' });
  }
});

// Get Feed (Your posts + followed users' posts)
router.get('/posts/feed', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const userIds = [currentUser._id, ...currentUser.following];

    let posts = await Post.find({ userId: { $in: userIds } })
      .populate('userId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 });

    // If feed is empty, show all public posts instead
    if (posts.length === 0) {
      posts = await Post.find()
        .populate('userId', 'username displayName avatarUrl')
        .sort({ createdAt: -1 })
        .limit(20);
    }

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching feed.' });
  }
});

// Get all posts (Explore)
router.get('/posts/all', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching posts.' });
  }
});

// Toggle Like
router.post('/posts/like/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const hasLiked = post.likes.includes(req.userId);
    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.json({ liked: !hasLiked, likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: 'Server error toggling like.' });
  }
});

// Delete Post
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Only creator can delete
    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    await Post.findByIdAndDelete(req.params.id);
    // Delete associated comments
    await Comment.deleteMany({ postId: req.params.id });

    res.json({ message: 'Post and comments deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting post.' });
  }
});


/* ==========================================================================
   COMMENT ROUTES
   ========================================================================== */

// Create Comment
router.post('/comments/:postId', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = new Comment({
      postId,
      userId: req.userId,
      content
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username displayName avatarUrl');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ error: 'Server error creating comment.' });
  }
});

// Get Comments for a Post
router.get('/comments/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .populate('userId', 'username displayName avatarUrl')
      .sort({ createdAt: 1 }); // Oldest first
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching comments.' });
  }
});

// Delete Comment
router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Allow deletion if requester is author of comment OR author of post
    const post = await Post.findById(comment.postId);
    const isCommentAuthor = comment.userId.toString() === req.userId;
    const isPostAuthor = post && post.userId.toString() === req.userId;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting comment.' });
  }
});

export default router;
