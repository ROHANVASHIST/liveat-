import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { messageService } from './services/messageService';
import { pinService } from './services/pinService';
import { blockService } from './services/blockService';
import { notificationService } from './services/notificationService';
import { analyticsService } from './services/analyticsService';
import { broadcastService } from './services/broadcastService';
import { securityService } from './services/securityService';
import { voiceLocationService } from './services/voiceLocationService';
import { securityHeaders, sanitizeInput, parameterPollution, corsOptions, securityLogger, preventOpenRedirects } from './security/enhancedSecurity';
import { rateLimiter } from './security/rateLimiter';
import securityRoutes from './routes/securityRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Initializing Supabase with URL:', process.env.SUPABASE_URL);
console.log('Publishable Key:', process.env.SUPABASE_PUBLISHABLE_KEY ? 'Present' : 'Missing');
console.log('Secret Key:', process.env.SUPABASE_SECRET_KEY ? 'Present' : 'Missing');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_PUBLISHABLE_KEY!
);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Apply security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(sanitizeInput);
app.use(parameterPollution);
app.use(securityLogger);
app.use(preventOpenRedirects);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'liveat-secret-key-change-in-production',
  name: 'concierge_session',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Apply rate limiting to all routes
app.use(rateLimiter);

// Security routes (MFA, Passkeys, Session Management)
app.use('/api/security', securityRoutes);

// Raw body parser for voice uploads (must be before regular body parsers)
app.use('/api/upload/voice', express.raw({ type: 'audio/webm', limit: '10mb' }));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_OAUTH_REDIRECT_URI!
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName;
    const avatar = profile.photos?.[0]?.value;

    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', profile.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing user:', fetchError);
      return done(fetchError);
    }

    if (existingUser) {
      return done(null, existingUser);
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        google_id: profile.id,
        email: email,
        name: name,
        avatar: avatar,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Error inserting new google user:', insertError);
      return done(insertError);
    }

    return done(null, newUser);
  } catch (error) {
    console.error('Google Auth Strategy Error:', error);
    return done(error as Error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
       console.error('Error in deserializeUser:', error);
       return done(error);
    }
    done(null, user);
  } catch (error) {
    console.error('Catch in deserializeUser:', error);
    done(error);
  }
});

app.get('/api/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

app.get('/api/google/auth/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/failure',
    session: true 
  }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || `http://${req.hostname}:5173`;
    res.redirect(`${frontendUrl}?auth=success`);
  }
);

app.get('/api/auth/failure', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || `http://${req.hostname}:5173`;
  res.redirect(`${frontendUrl}?auth=error`);
});

app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.patch('/api/auth/user', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userId = (req.user as any).id;
    const { name, avatar } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ name, avatar })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error('Supabase SignUp Error:', error);
      return res.status(400).json({ error: error.message });
    }

    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: data.user?.id,
        email: email,
        name: name,
      });

    if (dbError) {
      console.error('Error inserting user into DB during signup:', dbError);
    }

    const userData = { id: data.user?.id, email: email, name: name, avatar: null };

    req.login(userData, (loginErr) => {
      if (loginErr) {
        console.error('Login error after signup:', loginErr);
        return res.status(500).json({ error: 'Failed to establish session' });
      }
      res.json(userData);
    });
  } catch (error) {
    console.error('Unexpected error in signup route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase SignIn error:', error);
      return res.status(401).json({ error: error.message });
    }

    console.log('Supabase signin success for user id:', data.user?.id);

    const { data: user, error: userFetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user?.id)
      .maybeSingle();

    if (userFetchError) {
      console.error('Error fetching user after signin:', userFetchError);
      return res.status(500).json({ error: userFetchError.message });
    }

    if (!user) {
      console.log('User not found in users table, creating entry...');
      // Fallback: create user entry if missing
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user?.id,
          email: email,
          name: data.user?.user_metadata?.name || email.split('@')[0],
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user entry:', createError);
        return res.status(500).json({ error: 'Failed to create user record' });
      }
      return res.json(newUser);
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error after signin:', loginErr);
        return res.status(500).json({ error: 'Failed to establish session' });
      }
      res.json(user);
    });
  } catch (error) {
    console.error('Unexpected error in signin route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const { count: totalChats } = await supabase.from('messages').select('*', { count: 'exact', head: true });
    const { count: activeAgents } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    res.json({
      totalChats: totalChats || 2842,
      activeAgents: activeAgents || 48,
      responseTime: "1m 24s",
      csat: "4.9/5",
      trends: {
         chats: "+12.5%",
         response: "-4s"
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/status', async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    const userId = (req.user as any)?.id;

    const { data, error } = await supabase
      .from('status_updates')
      .insert({
        user_id: userId,
        content,
        media_url: mediaUrl,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const { data: status, error } = await supabase
      .from('status_updates')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = (req.user as any)?.id;
    const userName = (req.user as any)?.name;

    const { data, error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        emoji,
      }, {
        onConflict: 'message_id,user_id,emoji'
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;

    const { data: reactions, error } = await supabase
      .from('message_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;
    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Media Upload Endpoint
// ============================================
app.post('/api/upload', express.raw({ type: ['image/*', 'video/*', 'application/*'], limit: '10mb' }), async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, req.body, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    res.json({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// JSON-based upload for base64 media (used by the frontend)
app.post('/api/upload/base64', async (req, res) => {
  try {
    const { base64Data, contentType, fileName: originalName } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Strip out the data:image/...;base64, prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const ext = (contentType || 'application/octet-stream').split('/')[1]?.split(';')[0] || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Base64 upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    res.json({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Voice message upload (multipart/form-data)
app.post('/api/upload/voice', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const audioBuffer = req.body;
    
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const fileName = `voice-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
    const filePath = `voice-messages/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/webm',
        upsert: false,
      });

    if (error) {
      console.error('Voice upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    res.json({ url: urlData.publicUrl, path: filePath });
  } catch (error) {
    console.error('Voice upload error:', error);
    res.status(500).json({ error: 'Voice upload failed' });
  }
});

app.get('/api/online-count', (req, res) => {
  res.json({ count: clients.size });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// FEATURE: MESSAGE SEARCH
// ============================================
app.get('/api/messages/search', async (req, res) => {
  try {
    const { query, roomId, senderId, limit = 50, offset = 0 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await messageService.searchMessages(
      query as string,
      roomId as string,
      senderId as string,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// ============================================
// FEATURE: MESSAGE PINNING
// ============================================
app.post('/api/messages/:messageId/pin', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { messageId } = req.params;
    const { roomId } = req.body;
    const userId = (req.user as any).id;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const data = await pinService.pinMessage(messageId, roomId, userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin message' });
  }
});

app.delete('/api/messages/:messageId/pin', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { messageId } = req.params;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const result = await pinService.unpinMessage(messageId, roomId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unpin message' });
  }
});

app.get('/api/rooms/:roomId/pinned-messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const pinnedMessages = await pinService.getPinnedMessages(roomId);
    res.json(pinnedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
});

// ============================================
// FEATURE: USER BLOCKING
// ============================================
app.post('/api/users/:userId/block', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.params;
    const { reason } = req.body;
    const blockerId = (req.user as any).id;

    const data = await blockService.blockUser(blockerId, userId, reason);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to block user' });
  }
});

app.delete('/api/users/:userId/block', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.params;
    const blockerId = (req.user as any).id;

    const result = await blockService.unblockUser(blockerId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

app.get('/api/users/blocked', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const blockedUsers = await blockService.getBlockedUsers(userId);
    res.json(blockedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

app.get('/api/users/:userId/check-block', async (req, res) => {
  try {
    const { userId } = req.params;
    let blockerId = null;

    if (req.isAuthenticated()) {
      blockerId = (req.user as any).id;
    }

    if (!blockerId) {
      return res.json({ isBlocked: false });
    }

    const isBlocked = await blockService.isUserBlocked(blockerId, userId);
    res.json({ isBlocked });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check block status' });
  }
});

// ============================================
// FEATURE: NOTIFICATIONS
// ============================================
app.get('/api/notifications/settings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const settings = await notificationService.getOrCreateSettings(userId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

app.patch('/api/notifications/settings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const settings = await notificationService.updateSettings(userId, req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { unread = false } = req.query;

    const notifications = unread
      ? await notificationService.getUnreadNotifications(userId)
      : await notificationService.getAllNotifications(userId);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { notificationId } = req.params;
    const notification = await notificationService.markAsRead(notificationId);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const result = await notificationService.markAllAsRead(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

app.delete('/api/notifications/:notificationId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { notificationId } = req.params;
    const result = await notificationService.deleteNotification(notificationId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============================================
// FEATURE: ADVANCED ANALYTICS
// ============================================
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

app.get('/api/analytics/engagement', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const metrics = await analyticsService.getEngagementMetrics(period as string);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

app.get('/api/analytics/rooms', async (req, res) => {
  try {
    const metrics = await analyticsService.getRoomMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room metrics' });
  }
});

app.get('/api/analytics/heatmap', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const heatmap = await analyticsService.getActivityHeatmap(period as string);
    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity heatmap' });
  }
});

app.get('/api/analytics/content-types', async (req, res) => {
  try {
    const distribution = await analyticsService.getContentTypeDistribution();
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch content type distribution' });
  }
});

app.get('/api/analytics/retention', async (req, res) => {
  try {
    const retention = await analyticsService.getUserRetention();
    res.json(retention);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user retention' });
  }
});

// ============================================
// FEATURE: BROADCAST LISTS
// ============================================
app.post('/api/broadcasts', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { name, recipientIds } = req.body;
    const userId = (req.user as any).id;
    const broadcast = await broadcastService.createBroadcast(name, userId, recipientIds);
    res.json(broadcast);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

app.get('/api/broadcasts', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const broadcasts = await broadcastService.getUserBroadcasts(userId);
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

app.get('/api/broadcasts/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const broadcast = await broadcastService.getBroadcastDetails(req.params.id);
    res.json(broadcast);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch broadcast details' });
  }
});

app.delete('/api/broadcasts/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const result = await broadcastService.deleteBroadcast(req.params.id, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

app.post('/api/broadcasts/:id/send', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { content, roomId } = req.body;
    const user = req.user as any;
    const message = await broadcastService.sendBroadcastMessage(
      req.params.id,
      user.id,
      user.name,
      content,
      roomId
    );
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ============================================
// FEATURE: TWO-FACTOR AUTHENTICATION
// ============================================
app.post('/api/security/2fa/setup', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const secret = securityService.generateTotpSecret();
    const qrCodeUrl = `otpauth://totp/ChatApp:${userId}?secret=${secret}&issuer=ChatApp`;
    await securityService.enableTwoFactor(userId, secret, qrCodeUrl);
    res.json({ secret, qrCodeUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

app.post('/api/security/2fa/verify', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const { code } = req.body;
    const result = await securityService.verifyAndEnableTwoFactor(userId, code);
    res.json({ success: true, backupCodes: result.backupCodes });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to verify 2FA' });
  }
});

app.post('/api/security/2fa/disable', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const { code } = req.body;
    await securityService.disableTwoFactor(userId, code);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to disable 2FA' });
  }
});

app.get('/api/security/2fa/status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const enabled = await securityService.isTwoFactorEnabled(userId);
    res.json({ enabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check 2FA status' });
  }
});

// ============================================
// FEATURE: SESSION MANAGEMENT
// ============================================
app.get('/api/security/sessions', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const sessions = await securityService.getUserSessions(userId);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.delete('/api/security/sessions/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    await securityService.revokeSession(req.params.id, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

app.post('/api/security/sessions/revoke-others', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const currentSessionId = req.body.currentSessionId;
    await securityService.revokeOtherSessions(userId, currentSessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke other sessions' });
  }
});

// ============================================
// FEATURE: PRIVACY SETTINGS
// ============================================
app.get('/api/security/privacy', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const settings = await securityService.getPrivacySettings(userId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

app.patch('/api/security/privacy', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const settings = await securityService.updatePrivacySettings(userId, req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// ============================================
// FEATURE: MESSAGE EDITING & DELETION
// ============================================
app.patch('/api/messages/:messageId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { messageId } = req.params;
    const { content, oldContent } = req.body;
    const userId = (req.user as any).id;
    const message = await securityService.editMessage(messageId, userId, content, oldContent);
    res.json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to edit message' });
  }
});

app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { messageId } = req.params;
    const { deleteFor } = req.body;
    const userId = (req.user as any).id;
    await securityService.deleteMessage(messageId, userId, deleteFor);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete message' });
  }
});

app.get('/api/messages/:messageId/edits', async (req, res) => {
  try {
    const edits = await securityService.getMessageEditHistory(req.params.messageId);
    res.json(edits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch edit history' });
  }
});

// ============================================
// FEATURE: STARRED MESSAGES
// ============================================
app.post('/api/messages/:messageId/star', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { messageId } = req.params;
    const { roomId } = req.body;
    const userId = (req.user as any).id;
    const starred = await securityService.starMessage(messageId, userId, roomId);
    res.json(starred);
  } catch (error) {
    res.status(500).json({ error: 'Failed to star message' });
  }
});

app.delete('/api/messages/:messageId/star', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { messageId } = req.params;
    const userId = (req.user as any).id;
    await securityService.unstarMessage(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unstar message' });
  }
});

app.get('/api/messages/starred', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const starred = await securityService.getStarredMessages(userId);
    res.json(starred);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch starred messages' });
  }
});

// ============================================
// FEATURE: AUTO-DELETE SETTINGS
// ============================================
app.get('/api/rooms/:roomId/auto-delete', async (req, res) => {
  try {
    const setting = await securityService.getAutoDelete(req.params.roomId);
    res.json({ deleteAfter: setting });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auto-delete settings' });
  }
});

app.post('/api/rooms/:roomId/auto-delete', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { roomId } = req.params;
    const { deleteAfter } = req.body;
    const userId = (req.user as any).id;
    const setting = await securityService.setAutoDelete(roomId, userId, deleteAfter);
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set auto-delete' });
  }
});

// ============================================
// FEATURE: VOICE MESSAGES
// ============================================
app.post('/api/voice-messages', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { messageId, duration, audioUrl, audioPath, waveformData } = req.body;
    const userId = (req.user as any).id;
    const voiceMessage = await voiceLocationService.saveVoiceMessage(messageId, userId, {
      duration,
      audioUrl,
      audioPath,
      waveformData,
    });
    res.json(voiceMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save voice message' });
  }
});

app.get('/api/voice-messages/:messageId', async (req, res) => {
  try {
    const voiceMessage = await voiceLocationService.getVoiceMessage(req.params.messageId);
    res.json(voiceMessage || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch voice message' });
  }
});

// ============================================
// FEATURE: LIVE LOCATION
// ============================================
app.post('/api/live-location/start', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const { roomId, latitude, longitude, accuracy } = req.body;
    const location = await voiceLocationService.startLiveLocation(userId, roomId, {
      latitude,
      longitude,
      accuracy,
    });
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start live location' });
  }
});

app.post('/api/live-location/stop', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const { roomId } = req.body;
    await voiceLocationService.stopLiveLocation(userId, roomId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop live location' });
  }
});

app.get('/api/live-location/:roomId', async (req, res) => {
  try {
    const locations = await voiceLocationService.getActiveLocations(req.params.roomId);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live locations' });
  }
});

// ============================================
// FEATURE: MESSAGE FORWARDING
// ============================================
app.post('/api/messages/:messageId/forward', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const forward = await voiceLocationService.trackForward(req.params.messageId, userId);
    res.json(forward);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track forward' });
  }
});

app.get('/api/messages/:messageId/forward-count', async (req, res) => {
  try {
    const count = await voiceLocationService.getForwardCount(req.params.messageId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get forward count' });
  }
});

// ============================================
// FEATURE: MESSAGE REPORTS
// ============================================
app.post('/api/messages/:messageId/report', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const { reason, description } = req.body;
    const report = await voiceLocationService.reportMessage(req.params.messageId, userId, {
      reason,
      description,
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to report message' });
  }
});

app.get('/api/reports/pending', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const reports = await voiceLocationService.getPendingReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ============================================
// FEATURE: MEDIA SETTINGS
// ============================================
app.get('/api/media/settings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const settings = await voiceLocationService.getMediaSettings(userId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch media settings' });
  }
});

app.patch('/api/media/settings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = (req.user as any).id;
    const settings = await voiceLocationService.updateMediaSettings(userId, req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media settings' });
  }
});

// ============================================
// MAINTENANCE ENDPOINTS
// ============================================
app.post('/api/admin/cleanup/locations', async (req, res) => {
  try {
    await voiceLocationService.cleanupExpiredLocations();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup locations' });
  }
});

app.post('/api/admin/cleanup/messages', async (req, res) => {
  try {
    await voiceLocationService.cleanupOldMessages();
    await securityService.runAutoDeleteCleanup();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup messages' });
  }
});


const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

interface Client {
  id: string;
  name: string;
  ws: WebSocket;
}

const clients: Map<string, Client> = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  console.log('New client connected:', clientId);

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    
    if (message.type === 'join') {
      clients.set(clientId, { id: message.userId, name: message.userName, ws });
      console.log(`Client ${message.userId} joined as ${message.userName} on connection ${clientId}`);
      
      broadcastUserCount();
      
      broadcastToAll({
        type: 'user_joined',
        userId: message.userId,
        userName: message.userName,
        timestamp: new Date().toISOString(),
      });
    } else if (message.type === 'message') {
      // Upload media to Supabase Storage if it's a base64 data URL
      let mediaUrl = message.mediaUrl;
      let mediaStoragePath: string | null = null;

      if (mediaUrl && mediaUrl.startsWith('data:')) {
        try {
          const contentTypeMatch = mediaUrl.match(/^data:([^;]+);base64,/);
          const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
          const base64Clean = mediaUrl.replace(/^data:[^;]+;base64,/, '');
          const buffer = Buffer.from(base64Clean, 'base64');

          const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const filePath = `uploads/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, buffer, {
              contentType,
              upsert: false,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('chat-media')
              .getPublicUrl(filePath);
            mediaUrl = urlData.publicUrl;
            mediaStoragePath = filePath;
            console.log('Media uploaded to storage:', filePath);
          } else {
            console.error('Failed to upload media:', uploadError);
          }
        } catch (err) {
          console.error('Error uploading inline media:', err);
        }
      }

      // Calculate message expiry (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: savedMessage } = await supabase
        .from('messages')
        .insert({
          sender_id: message.senderId,
          sender_name: message.senderName,
          content: message.content,
          room_id: message.roomId,
          message_type: message.msgType || 'text',
          media_url: mediaUrl,
          media_storage_path: mediaStoragePath,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      const msgType = message.msgType || 'text';
      broadcastToAll({
        type: 'message',
        id: savedMessage?.id || Date.now().toString(),
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: savedMessage?.created_at || new Date().toISOString(),
        expiresAt: savedMessage?.expires_at || expiresAt.toISOString(),
        msgType: msgType,
        mediaUrl: mediaUrl,
      });
    } else if (message.type === 'read_receipt') {
      broadcastToAll({
        type: 'read_receipt',
        messageId: message.messageId,
        userId: message.userId,
        timestamp: new Date().toISOString(),
      });
    } else if (message.type === 'typing') {
      broadcastToAll({
        type: 'typing',
        userId: message.userId,
        roomId: message.roomId,
        isTyping: message.isTyping,
      });
    } else if (message.type === 'create_room') {
      const { data: room } = await supabase
        .from('rooms')
        .insert({
          name: message.roomName,
          description: message.roomDescription,
          type: message.roomType || 'public',
        })
        .select()
        .single();

      broadcastToAll({
        type: 'room_created',
        roomId: room.id,
        roomName: room.name,
        roomDescription: room.description,
        roomType: room.type,
      });
    } else if (message.type === 'load_messages') {
      // Only load messages from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', message.roomId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(200);

      if (messages) {
        ws.send(JSON.stringify({
          type: 'message_history',
          messages: messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            content: msg.content,
            timestamp: msg.created_at,
            expiresAt: msg.expires_at,
            msgType: msg.message_type,
            mediaUrl: msg.media_url,
          })),
        }));
      }
    } else if (message.type === 'load_status') {
      const { data: status } = await supabase
        .from('status_updates')
        .select('*')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (status) {
        ws.send(JSON.stringify({
          type: 'status_updates',
          status: status,
        }));
      }
    } else if (message.type === 'reaction') {
      broadcastToAll({
        type: 'reaction',
        messageId: message.messageId,
        emoji: message.emoji,
        userId: message.userId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client) {
      console.log(`Client ${clientId} disconnected (${client.name})`);
      clients.delete(clientId);
      broadcastUserCount();
      broadcastToAll({
        type: 'user_left',
        userId: clientId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcastToAll(data: object) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastUserCount() {
  broadcastToAll({
    type: 'user_count',
    count: clients.size,
  });
}

// ============================================
// 7-Day Cleanup Job — runs every 6 hours (DISABLED)
// ============================================
// async function cleanupExpiredMessages() { ... }
// cleanupExpiredMessages();
// setInterval(cleanupExpiredMessages, ...);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

