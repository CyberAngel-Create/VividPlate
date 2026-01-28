      const category = req.query.category as string | undefined;
      
      let fileUploads;
      if (category) {
        // If a specific category is requested, filter by that category
        fileUploads = (await storage.getFileUploadsByRestaurantId(restaurantId))
          .filter(upload => upload.fileCategory === category);
      } else {
        // Otherwise get all uploads for this restaurant
        fileUploads = await storage.getFileUploadsByRestaurantId(restaurantId);
      }
      
      // Group the uploads by category for better organization
      const uploadsByCategory: Record<string, any[]> = {};
      
      fileUploads.forEach(upload => {
        const category = upload.fileCategory;
        if (!uploadsByCategory[category]) {
          uploadsByCategory[category] = [];
        }
        uploadsByCategory[category].push(upload);
      });
      
      res.json({
        total: fileUploads.length,
        uploads: fileUploads,
        uploadsByCategory
      });
    } catch (error) {
      console.error('Error fetching restaurant uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploads' });
    }
  });
  
  // Delete a file upload (check if user has permission)
  app.delete('/api/uploads/:uploadId', isAuthenticated, async (req, res) => {
    try {
      const uploadId = parseInt(req.params.uploadId);
      const userId = (req.user as any).id;
      
      // Get the upload to check ownership
      const upload = await storage.getFileUpload(uploadId);
      
      if (!upload) {
        return res.status(404).json({ message: 'File upload not found' });
      }
      
      // Check if user owns this upload or is the owner of the restaurant
      if (upload.userId !== userId) {
        // If the user is not the direct owner of the upload, check if they own the restaurant
        if (upload.restaurantId) {
          const restaurant = await storage.getRestaurant(upload.restaurantId);
          if (!restaurant || restaurant.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this file' });
          }
        } else {
          return res.status(403).json({ message: 'You do not have permission to delete this file' });
        }
      }
      
      // If we're here, the user has permission to delete the file
      // First, try to delete the physical file
      try {
        if (upload.filePath && fs.existsSync(upload.filePath)) {
          fs.unlinkSync(upload.filePath);
          console.log(`Physical file deleted: ${upload.filePath}`);
        }
      } catch (fileError) {
        console.error(`Error deleting physical file: ${fileError}`);
        // Continue with database deletion even if physical file deletion fails
      }
      
      // Delete the record from the database
      const deleted = await storage.deleteFileUpload(uploadId);
      
      if (deleted) {
        console.log(`File upload with ID ${uploadId} deleted by user ${userId}`);
        return res.json({ success: true, message: 'File deleted successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to delete file record from database' });
      }
    } catch (error) {
      console.error('Error deleting file upload:', error);
      res.status(500).json({ message: 'Server error deleting file' });
    }
  });
  
  // Get all uploads for the current user (across all restaurants)
  app.get('/api/user/uploads', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const category = req.query.category as string | undefined;
      
      let fileUploads;
      if (category) {
        // If a specific category is requested, filter by that category
        fileUploads = (await storage.getFileUploadsByUserId(userId))
          .filter(upload => upload.fileCategory === category);
      } else {
        // Otherwise get all uploads for this user
        fileUploads = await storage.getFileUploadsByUserId(userId);
      }
      
      // Group by restaurant and category
      const uploadsByRestaurant: Record<number, any> = {};
      const uploadsByCategory: Record<string, any[]> = {};
      
      for (const upload of fileUploads) {
        // Group by restaurant
        const restaurantId = upload.restaurantId;
        if (restaurantId) {
          if (!uploadsByRestaurant[restaurantId]) {
            uploadsByRestaurant[restaurantId] = {
              restaurantId,
              uploads: [],
              categories: {}
            };
          }
          uploadsByRestaurant[restaurantId].uploads.push(upload);
          
          // Group within restaurant by category
          const category = upload.fileCategory;
          if (!uploadsByRestaurant[restaurantId].categories[category]) {
            uploadsByRestaurant[restaurantId].categories[category] = [];
          }
          uploadsByRestaurant[restaurantId].categories[category].push(upload);
        }
        
        // Group by category across all restaurants
        const category = upload.fileCategory;
        if (!uploadsByCategory[category]) {
          uploadsByCategory[category] = [];
        }
        uploadsByCategory[category].push(upload);
      }
      
      // Get restaurant names for better presentation
      const restaurantIds = Object.keys(uploadsByRestaurant).map(id => parseInt(id));
      const restaurantPromises = restaurantIds.map(id => storage.getRestaurant(id));
      const restaurants = await Promise.all(restaurantPromises);
      
      // Add restaurant info to the grouped data
      for (let i = 0; i < restaurantIds.length; i++) {
        const id = restaurantIds[i];
        const restaurant = restaurants[i];
        if (restaurant && uploadsByRestaurant[id]) {
          uploadsByRestaurant[id].restaurant = {
            id: restaurant.id,
            name: restaurant.name,
            logoUrl: restaurant.logoUrl
          };
        }
      }
      
      res.json({
        total: fileUploads.length,
        uploads: fileUploads,
        uploadsByCategory,
        uploadsByRestaurant
      });
    } catch (error) {
      console.error('Error fetching user uploads:', error);
      res.status(500).json({ message: 'Failed to fetch uploads' });
    }
  });

  // Serve permanent images from database with optimized caching
  app.get('/api/images/:filename', async (req, res) => {
    try {
      const { PermanentImageService } = await import('./permanent-image-service');
      const filename = req.params.filename;
      
      const image = await PermanentImageService.getImage(filename);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }
      
      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(image.imageData, 'base64');
      
      // Generate ETag for better caching
      const { createHash } = await import('crypto');
      const etag = createHash('md5').update(imageBuffer).digest('hex');
      
      // Check if client has cached version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
      
      // Set comprehensive caching headers
      res.set({
        'Content-Type': image.mimeType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year, immutable
        'ETag': etag,
        'Last-Modified': new Date(image.uploadedAt).toUTCString(),
        'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year from now
        'Content-Disposition': `inline; filename="${image.originalName}"`
      });
      
      res.send(imageBuffer);
    } catch (error) {
      console.error('Error serving permanent image:', error);
      res.status(500).json({ message: 'Error serving image' });
    }
  });

  // Get all menu data for a restaurant (for public view)
  app.get('/api/restaurants/:restaurantId/menu', async (req, res) => {
    try {
      const restaurantIdParam = req.params.restaurantId;
      let restaurantId: number = 0; // Initialize with a default value
      let restaurant;
      
      // Try to parse as number first (for backward compatibility)
      if (!isNaN(parseInt(restaurantIdParam))) {
        restaurantId = parseInt(restaurantIdParam);
        restaurant = await storage.getRestaurant(restaurantId);
      } else {
        // If not a number, try to get restaurant by name
        console.log(`Fetching menu for restaurant name: ${restaurantIdParam}`);
        const normalizedName = decodeURIComponent(restaurantIdParam).replace(/-/g, ' ');
        
        // Fetch all restaurants and find the one with matching name
        const allRestaurants = await storage.getAllRestaurants();
        restaurant = allRestaurants.find(
          (r) => r.name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (restaurant) {
          restaurantId = restaurant.id;
        }
      }
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Get the restaurant owner's subscription tier
      let subscriptionTier = "free"; // Default tier
      let isPremiumRestaurant = false; // Track premium status separately
      
      try {
        // Fetch user to get their subscription tier
        if (restaurant.userId) {
          const restaurantOwner = await storage.getUser(restaurant.userId);
          
          if (restaurantOwner) {
            // Try to get the active subscription
            const ownerSubscription = await storage.getActiveSubscriptionByUserId(restaurant.userId);
            
            if (ownerSubscription && ownerSubscription.tier) {
              subscriptionTier = ownerSubscription.tier;
              isPremiumRestaurant = subscriptionTier === "premium";
            } else if (restaurantOwner.subscriptionTier) {
              // Fallback to user's subscription tier if stored there
              subscriptionTier = restaurantOwner.subscriptionTier;
              isPremiumRestaurant = subscriptionTier === "premium";
            }
            
            console.log(`Restaurant ${restaurantId} owner subscription status:`, {
              tier: subscriptionTier,
              isPremium: isPremiumRestaurant
            });
          }
        }
      } catch (subError) {
        console.error("Error fetching restaurant owner subscription:", subError);
        // Continue with default free tier if there's an error
      }
      
      // Convert restaurant image URLs to absolute URLs and add subscription tier
      const restaurantWithSub = {
        ...restaurant,
        subscriptionTier,
        isPremium: isPremiumRestaurant,
        logoUrl: makeAbsoluteUrl(restaurant.logoUrl, req),
        bannerUrl: makeAbsoluteUrl(restaurant.bannerUrl, req),
        bannerUrls: Array.isArray(restaurant.bannerUrls) 
          ? restaurant.bannerUrls.map(url => makeAbsoluteUrl(url, req))
          : restaurant.bannerUrls
      };
      
      const categories = await storage.getMenuCategoriesByRestaurantId(restaurantId);
      
      const menu = await Promise.all(categories.map(async (category) => {
        const items = await storage.getMenuItemsByCategoryId(category.id);
        return {
          ...category,
          items: items.map(item => ({
            ...item,
            imageUrl: makeAbsoluteUrl(item.imageUrl, req)
          }))
        };
      }));
      
      // Record a new view
      const viewSource = req.query.source as string || 'link';
      await storage.createMenuView({
        restaurantId,
        source: viewSource
      });
      
      // If this is a QR code scan, increment the counter
      if (viewSource === 'qr') {
        try {
          // Get current restaurant to ensure we have the latest state
          const currentRestaurant = await storage.getRestaurant(restaurantId);
          if (!currentRestaurant) {
            console.error(`Restaurant ${restaurantId} not found when incrementing QR code scan count`);
          } else {
            // Ensure QR code scans has a valid value
            const currentScans = currentRestaurant.qrCodeScans || 0;
            
            const result = await storage.incrementQRCodeScans(restaurantId);
            
            if (result) {
              console.log(`QR code scan successfully recorded for restaurant ${restaurantId}. New count: ${result.qrCodeScans || 0}`);
            } else {
              console.error(`Failed to increment QR code scan count for restaurant ${restaurantId}`);
              
              // Fallback update if the main increment method failed
              try {
                const updatedRestaurant = await storage.updateRestaurant(restaurantId, { 
                  qrCodeScans: currentScans + 1 
                });
                if (updatedRestaurant) {
                  console.log(`QR code scan recorded using fallback method. New count: ${updatedRestaurant.qrCodeScans || 0}`);
                }
              } catch (fallbackError) {
                console.error(`Fallback QR code scan increment also failed: ${fallbackError}`);
              }
            }
          }
        } catch (qrError) {
          console.error(`Error incrementing QR code scan count: ${qrError}`);
          // Don't fail the whole request if just the QR counter fails
        }
      }
      
      res.json({
        restaurant: restaurantWithSub,
        menu
      });
    } catch (error) {
      console.error("Error fetching restaurant menu:", error);
      res.status(500).json({ message: 'Server error', details: String(error) });
    }
  });
  
  // Customer feedback submission
  app.post('/api/restaurants/:restaurantId/feedback', async (req, res) => {
    try {
      const { menuItemId, rating, comment, customerName, customerEmail } = req.body;
      
      if (!menuItemId || !rating) {
        return res.status(400).json({ message: 'Menu item ID and rating are required' });
      }
      
      const feedbackData = {
        menuItemId: parseInt(menuItemId),
        restaurantId: parseInt(req.params.restaurantId),
        rating: parseInt(rating),
        comment: comment || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        status: 'pending'
      };
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get feedback for a specific restaurant
  app.get('/api/restaurants/:restaurantId/feedback', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const feedback = await storage.getFeedbacksByRestaurantId(parseInt(req.params.restaurantId));
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Dedicated endpoint for incrementing QR code scans
  app.post('/api/restaurants/:restaurantId/qr-scan', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      console.log(`DEDICATED QR SCAN ENDPOINT: Processing scan request for restaurant ID ${restaurantId}`);
      
      // Get the restaurant and current scan count
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        console.error(`DEDICATED QR SCAN ENDPOINT: Restaurant ${restaurantId} not found`);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Get current scan count and log it
      const currentScans = restaurant.qrCodeScans || 0;
      console.log(`DEDICATED QR SCAN ENDPOINT: Current scan count for restaurant ${restaurantId}: ${currentScans}`);
      
      // Try different methods to increment the counter
      let success = false;
      
      // Method 1: Use the dedicated incrementQRCodeScans method
      try {
        const result = await storage.incrementQRCodeScans(restaurantId);
        if (result && typeof result.qrCodeScans === 'number') {
          console.log(`DEDICATED QR SCAN ENDPOINT: Successfully incremented QR code scans to ${result.qrCodeScans}`);
          success = true;
          return res.status(200).json({ 
            success: true, 
            message: 'QR code scan recorded successfully', 
            previousCount: currentScans,
            newCount: result.qrCodeScans
          });
        }
      } catch (method1Error) {
        console.error(`DEDICATED QR SCAN ENDPOINT: Method 1 failed: ${method1Error}`);
      }
      
      // Method 2: Direct update via raw SQL as a fallback
      if (!success) {
        try {
          const { pool } = await import('./db');
          const result = await pool.query(
            'UPDATE restaurants SET qr_code_scans = $1 WHERE id = $2 RETURNING qr_code_scans',
            [currentScans + 1, restaurantId]
          );
          
          if (result.rows && result.rows.length > 0) {
            const newCount = result.rows[0].qr_code_scans;
            console.log(`DEDICATED QR SCAN ENDPOINT: Raw SQL update successful. New count: ${newCount}`);
            return res.status(200).json({ 
              success: true, 
              message: 'QR code scan recorded successfully using raw SQL', 
              previousCount: currentScans,
              newCount: newCount
            });
          }
        } catch (method2Error) {
          console.error(`DEDICATED QR SCAN ENDPOINT: Method 2 failed: ${method2Error}`);
        }
      }
      
      // If all methods failed
      console.error(`DEDICATED QR SCAN ENDPOINT: All increment methods failed for restaurant ${restaurantId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to increment QR code scan count' 
      });
    } catch (error) {
      console.error(`DEDICATED QR SCAN ENDPOINT: Unexpected error: ${error}`);
      res.status(500).json({ message: 'Server error', details: String(error) });
    }
  });
  
  // Admin routes
  app.get('/api/admin/restaurants', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      
      // Enhanced restaurants with additional data
      const enhancedRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
        // Get restaurant owner info
        const owner = await storage.getUser(restaurant.userId);
        
        // Get category and menu item counts
        const categories = await storage.getMenuCategoriesByRestaurantId(restaurant.id);
        const menuItems = await storage.getMenuItemsByRestaurantId(restaurant.id);
        const viewCount = await storage.countMenuViewsByRestaurantId(restaurant.id);
        
        // Get most recent visits
        const recentViews = await storage.getMenuViewsByRestaurantId(restaurant.id);
        const lastVisitDate = recentViews.length > 0 ? recentViews[0].viewedAt : null;
        
        // Get owner's subscription tier
        const ownerSubscriptionTier = owner?.subscriptionTier || 'free';
        
        return {
          ...restaurant,
          ownerName: owner ? owner.fullName || owner.username : 'N/A',
          userEmail: owner ? owner.email : null,
          categoryCount: categories.length,
          menuItemCount: menuItems.length,
          viewCount: viewCount,
          lastVisitDate: lastVisitDate,
          ownerSubscriptionTier: ownerSubscriptionTier
        };
      }));
      
      res.json(enhancedRestaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/admin/feedback', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get all restaurants to aggregate feedback
      const restaurants = await storage.getAllRestaurants();
      
      // Create an array to hold all feedback from all restaurants
      let allFeedback: any[] = [];
      
      // For each restaurant, get its feedback and add to the array
      for (const restaurant of restaurants) {
        const feedback = await storage.getFeedbacksByRestaurantId(restaurant.id);
        allFeedback = [...allFeedback, ...feedback];
      }
      
      // Sort feedback by date (newest first)
      allFeedback.sort((a, b) => {
        const dateA = new Date(a.createdAt ? a.createdAt.toString() : 0).getTime();
        const dateB = new Date(b.createdAt ? b.createdAt.toString() : 0).getTime();
        return dateB - dateA;
      });
      
      res.json(allFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });
  
  // Approve or reject feedback
  app.patch('/api/admin/feedback/:feedbackId/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const feedback = await storage.approveFeedback(parseInt(req.params.feedbackId));
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.patch('/api/admin/feedback/:feedbackId/reject', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const feedback = await storage.rejectFeedback(parseInt(req.params.feedbackId));
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Restaurant owner feedback endpoints
  app.get('/api/restaurants/:restaurantId/feedback', isAuthenticated, isRestaurantOwner, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const feedbacks = await storage.getFeedbacksByRestaurantId(restaurantId);
      res.json(feedbacks);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });

  // Get user image usage statistics
  app.get('/api/user/image-usage', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Count uploaded images for this user
      const uploadedImages = await storage.getUserImageCount(userId);
      
      // Determine limits based on subscription tier
      const maxImages = user.subscriptionTier === 'premium' ? 1000 : 10; // Free: 10, Premium: 1000
      const remainingImages = Math.max(0, maxImages - uploadedImages);

      res.json({
        uploadedImages,
        maxImages,
        remainingImages,
        subscriptionTier: user.subscriptionTier || 'free'
      });
    } catch (error) {
      console.error('Error fetching image usage:', error);
      res.status(500).json({ message: 'Failed to fetch image usage' });
    }
  });
  
  // Customer feedback submission endpoint (no auth required)
  app.post('/api/restaurants/:restaurantId/feedback/submit', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const restaurant = await storage.getRestaurant(restaurantId);
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      
      // Check if the restaurant is premium - ONLY premium restaurants get feedback
      const restaurantOwner = await storage.getUser(restaurant.userId); // Use userId instead of ownerId
      // Check premium status from owner and restaurant settings
      let isPremium = false;
      
      // Check if owner is premium
      if (restaurantOwner && 
          (restaurantOwner.subscriptionTier === 'premium' || 
           restaurantOwner.username === 'Entoto Cloud')) {
        isPremium = true;
      }
      
      // Log restaurant premium status for debugging
      console.log('Restaurant premium check for feedback:', {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ownerName: restaurantOwner?.username || 'unknown',
        ownerTier: restaurantOwner?.subscriptionTier || 'none',
        isEntotoCloud: restaurantOwner?.username === 'Entoto Cloud',
        isPremium
      });
      
      if (!isPremium) {
        return res.status(403).json({ 
          message: 'Feedback is only available for premium restaurants',
          isPremium: false 
        });
      }
      
      // Create feedback with validation
      const { menuItemId, rating, comment, customerName, customerEmail } = req.body;
      
      if (!rating) {
        return res.status(400).json({ message: 'Rating is required' });
      }
      
      // Prepare feedback data with proper types
      let feedbackData: any = {
        restaurantId,
        rating: parseInt(rating),
        comment: comment || null,
        customerName: customerName || null,
        customerEmail: customerEmail || null,
        status: 'pending' // All new feedback starts as pending
      };
      
      // Only add menuItemId if it's provided
      if (menuItemId) {
        feedbackData.menuItemId = parseInt(menuItemId);
      }
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Server error';
        res.status(500).json({ message: errorMsg });
      }
    }
  });
  
  app.post('/api/feedback/:feedbackId/approve', isAuthenticated, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const feedback = await storage.getFeedback(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(feedback.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedFeedback = await storage.approveFeedback(feedbackId);
      res.json(updatedFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });
  
  app.post('/api/feedback/:feedbackId/reject', isAuthenticated, async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      const feedback = await storage.getFeedback(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
      }
      
      // Check if user owns the restaurant
      const restaurant = await storage.getRestaurant(feedback.restaurantId);
      if (!restaurant || restaurant.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const updatedFeedback = await storage.rejectFeedback(feedbackId);
      res.json(updatedFeedback);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Server error';
      res.status(500).json({ message: errorMsg });
    }
  });

  // API: Dietary Preferences
  app.post('/api/dietary-preferences', async (req, res) => {
    try {
      // For logged in users, associate with user ID
      let userId = null;
      if (req.isAuthenticated()) {
        userId = req.user.id;
      }
      
      // For anonymous users, store session ID
      let sessionId = req.body.sessionId;
      if (!userId && !sessionId) {
        sessionId = uuidv4();
      }
      
      // Check if preferences already exist for this user/session
      let preference;
      if (userId) {
        preference = await storage.getDietaryPreferenceByUserId(userId);
      } else if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
      }
      
      // If preference exists, update it
      if (preference) {
        preference = await storage.updateDietaryPreference(preference.id, {
          ...req.body,
          userId,
          sessionId
        });
        return res.json({ preference, sessionId });
      }
      
      // Otherwise create new preference
      preference = await storage.createDietaryPreference({
        ...req.body,
        userId,
        sessionId
      });
      
      res.status(201).json({ preference, sessionId });
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      res.status(500).json({ message: 'Error saving dietary preferences', error: String(error) });
    }
  });
  
  app.get('/api/dietary-preferences', async (req, res) => {
    try {
      let preference;
      
      // For logged in users, get by user ID
      if (req.isAuthenticated()) {
        preference = await storage.getDietaryPreferenceByUserId(req.user.id);
        if (preference) {
          return res.json(preference);
        }
      }
      
      // For anonymous users, get by session ID
      const sessionId = req.query.sessionId as string;
      if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
        if (preference) {
          return res.json(preference);
        }
      }
      
      res.status(404).json({ message: 'No dietary preferences found' });
    } catch (error) {
      console.error('Error fetching dietary preferences:', error);
      res.status(500).json({ message: 'Error fetching dietary preferences', error: String(error) });
    }
  });
  
  app.get('/api/menu-recommendations/:restaurantId', async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const sessionId = req.query.sessionId as string;
      
      // Get dietary preferences
      let preference;
      if (req.isAuthenticated()) {
        preference = await storage.getDietaryPreferenceByUserId(req.user.id);
      } else if (sessionId) {
        preference = await storage.getDietaryPreferenceBySessionId(sessionId);
      }
      
      if (!preference) {
        return res.status(404).json({ message: 'No dietary preferences found' });
      }
      
      // Get all menu items for this restaurant
      const menuItems = await storage.getMenuItemsByRestaurantId(restaurantId);
      
      // Filter and score items based on preferences
      const recommendations = menuItems.map(item => {
        let score = 0;
        let match = false;
        
        // Return early if no dietary info for this item
        if (!item.dietaryInfo) {
          return { item, score, match: false };
        }
        
        // Check for allergies
        if (preference.allergies && item.allergens) {
          const hasAllergens = preference.allergies.some(allergy => 
            item.allergens?.includes(allergy)
          );
          if (hasAllergens) {
            return { item, score: -100, match: false };
          }
        }
        
        // Score based on preferences
        if (preference.preferences && item.dietaryInfo) {
          // TypeScript will see dietaryInfo as unknown, so we need to cast
          const dietaryInfo = item.dietaryInfo as any;
          
          // For each preference, check if the item matches
          for (const [key, value] of Object.entries(preference.preferences)) {
            if (dietaryInfo[key] === value) {
              score += 10;
              match = true;
            }
          }
        }
        
        // Calorie matching
        if (preference.calorieGoal && item.calories) {
          // Higher score for items closer to calorie goal
          const calorieScore = 10 - Math.min(10, Math.abs(preference.calorieGoal - item.calories) / 100);
          score += calorieScore;
          
          // If within 20% of calorie goal, consider it a match
          if (Math.abs(preference.calorieGoal - item.calories) < preference.calorieGoal * 0.2) {
            match = true;
          }
        }
        
        return { item, score, match };
      });
      
      // Sort by score descending
      recommendations.sort((a, b) => b.score - a.score);
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ message: 'Error getting recommendations', error: String(error) });
    }
  });

  // Registration analytics routes
  app.get('/api/admin/registration-analytics', isAdmin, async (req, res) => {
    try {
      // Get date range from query parameters or default to last 30 days
      const endDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);
      
      const startDateParam = req.query.startDate ? new Date(req.query.startDate as string) : defaultStartDate;
      const endDateParam = req.query.endDate ? new Date(req.query.endDate as string) : endDate;
      
      // Ensure valid dates
      const startDate = !isNaN(startDateParam.getTime()) ? startDateParam : defaultStartDate;
      const endDateWithTime = !isNaN(endDateParam.getTime()) ? endDateParam : endDate;
      // Set end date to end of day
      endDateWithTime.setHours(23, 59, 59, 999);
      
      // Get source filter if provided
      const source = req.query.source as string | undefined;
      
      try {
        // Get counts
        const totalRegistrationsInRange = await storage.countRegistrationsInDateRange(startDate, endDateWithTime);
        
        // Get counts by source if no specific source filter
        let registrationsBySource = {};
        if (!source) {
          const websiteCount = await storage.countRegistrationsBySource('website');
          const mobileCount = await storage.countRegistrationsBySource('mobile');
          const referralCount = await storage.countRegistrationsBySource('referral');
          const otherCount = await storage.countRegistrationsBySource('other');
          
          registrationsBySource = {
            website: websiteCount,
            mobile: mobileCount,
            referral: referralCount,
            other: otherCount
          };
        }
        
        res.json({
          totalRegistrationsInRange,
          registrationsBySource: source ? { [source]: await storage.countRegistrationsBySource(source) } : registrationsBySource,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDateWithTime.toISOString()
          }
        });
      } catch (analyticsError) {
        console.error('Error running analytics queries:', analyticsError);
        
        // Handle the specific case of missing tables with a more user-friendly message
        if (analyticsError.message && analyticsError.message.includes('relation "registration_analytics" does not exist')) {
          return res.status(503).json({ 
            message: 'Registration analytics are being set up. Please try again later or run database migrations.',
            error: 'TABLE_NOT_CREATED_YET',
            analytics: {
              totalRegistrationsInRange: 0,
              registrationsBySource: {
                website: 0,
                mobile: 0,
                referral: 0,
                other: 0
              },
              dateRange: {
                startDate: startDate.toISOString(),
                endDate: endDateWithTime.toISOString()
              }
            }
          });
        }
        
        // For other errors, return a generic error
        return res.status(500).json({ message: 'Error processing analytics data' });
      }
    } catch (error) {
      console.error('Error fetching registration analytics:', error);
      res.status(500).json({ message: 'Failed to fetch registration analytics' });
    }
  });

// Admin routes
  app.get('/api/admin/dashboard', isAdmin, async (req, res) => {
    try {
      const totalUsers = await storage.countUsers();
      const activeUsers = await storage.countActiveUsers();
      const freeUsers = await storage.countUsersBySubscriptionTier('free');
      const paidUsers = await storage.countUsersBySubscriptionTier('premium');
      const recentUsers = await storage.getRecentUsers(5);

      // Exclude sensitive data
      const sanitizedUsers = recentUsers.map(user => {
        const { password, resetPasswordToken, resetPasswordExpires, ...rest } = user;
        return rest;
      });

      // Get registration analytics data for different time periods
      const now = new Date();
      
      // Time periods
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(now.getDate() - 1);
      
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setDate(now.getDate() - 30);
      
      const oneYearAgo = new Date(now);
      oneYearAgo.setDate(now.getDate() - 365);
      
      // Initialize registration stats
      const registrationStats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0
      };
      
      const viewStats = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        total: 0
      };
      
      try {
        // Get registration analytics
        registrationStats.daily = await storage.countRegistrationsInDateRange(oneDayAgo, now);
        registrationStats.weekly = await storage.countRegistrationsInDateRange(oneWeekAgo, now);
        registrationStats.monthly = await storage.countRegistrationsInDateRange(oneMonthAgo, now);
        registrationStats.yearly = await storage.countRegistrationsInDateRange(oneYearAgo, now);
        
        // Get view analytics
        viewStats.daily = await storage.countMenuViewsInDateRange(oneDayAgo, now);
        viewStats.weekly = await storage.countMenuViewsInDateRange(oneWeekAgo, now);
        viewStats.monthly = await storage.countMenuViewsInDateRange(oneMonthAgo, now);
        viewStats.yearly = await storage.countMenuViewsInDateRange(oneYearAgo, now);
        viewStats.total = await storage.countTotalMenuViews();
      } catch (analyticsError) {
        console.error('Error fetching analytics data (table may not exist yet):', analyticsError);
        // Continue without analytics data if the table doesn't exist yet
      }
      
      res.json({
        totalUsers,
        activeUsers,
        freeUsers,
        paidUsers,
        recentUsers: sanitizedUsers,
        registrationStats,
        viewStats,
        registrationPeriod: {
          startDate: oneWeekAgo.toISOString(),
          endDate: now.toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      
      const users = await storage.getAllUsers();
      
      // Simple pagination for now, in production would use proper SQL pagination
      const paginatedUsers = users.slice(offset, offset + limit);
      
      // Exclude sensitive data
      const sanitizedUsers = paginatedUsers.map(user => {
        const { password, resetPasswordToken, resetPasswordExpires, ...rest } = user;
        return rest;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Admin password reset endpoint
  app.put('/api/admin/users/:userId/reset-password', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { newPassword } = req.body;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      // Get the user to verify they exist
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Hash the new password using bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the user's password
      const updatedUser = await storage.updateUserPassword(userId, hashedPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to reset password' });
      }
      
      // Log the admin action
      const adminUser = req.user as any;
      await storage.createAdminLog({
        adminId: adminUser.id,
        action: 'PASSWORD_RESET',
        entityType: 'user',
        entityId: userId,
        details: { username: user.username }
      });
      
      console.log(`Password reset successful for user ID ${userId}: username="${user.username}", email="${user.email}"`);
      
      res.json({
        success: true,
        message: `Password reset successfully for user "${user.username}" (${user.email}). Use these credentials to login.`,
        userCredentials: {
          username: user.username,
          email: user.email,
          userId: user.id
        }
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.get('/api/admin/restaurants', isAdmin, async (req, res) => {
    try {
      const restaurants = await storage.getAllRestaurants();
      
      // Enhanced restaurants with additional data
      const enhancedRestaurants = await Promise.all(restaurants.map(async (restaurant) => {
        // Get restaurant owner info
        const owner = await storage.getUser(restaurant.userId);
        
        // Get category and menu item counts
        const categories = await storage.getMenuCategoriesByRestaurantId(restaurant.id);
        const menuItems = await storage.getMenuItemsByRestaurantId(restaurant.id);
        const viewCount = await storage.countMenuViewsByRestaurantId(restaurant.id);
        
        // Get most recent visits
        const recentViews = await storage.getMenuViewsByRestaurantId(restaurant.id);
        const lastVisitDate = recentViews.length > 0 ? recentViews[0].viewedAt : null;
        
        // Get owner's subscription tier
        const ownerSubscriptionTier = owner?.subscriptionTier || 'free';
        
        return {
          ...restaurant,
          ownerName: owner ? owner.username : 'N/A',
          userEmail: owner ? owner.email : null,
          categoryCount: categories.length,
          menuItemCount: menuItems.length,
          viewCount: viewCount,
          lastVisitDate: lastVisitDate,
          // Only use the owner's subscription tier
          ownerSubscriptionTier: ownerSubscriptionTier
        };
      }));
      
      console.log('Enhanced restaurant data:', enhancedRestaurants[0]); // Logging first restaurant for debugging
      
      res.json(enhancedRestaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'create_user',
        entityType: 'user',
        entityId: user.id,
        details: `Created user ${user.username} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, ...sanitizedUser } = user;
      
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  });

  app.patch('/api/admin/users/:id/status', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean' });
      }
      
      const updatedUser = await storage.toggleUserStatus(userId, isActive);
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'update_user_status',
        entityType: 'user',
        entityId: updatedUser.id,
        details: `Set user ${updatedUser.username} status to ${isActive ? 'active' : 'inactive'} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, resetPasswordToken, resetPasswordExpires, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/admin/users/:id/subscription', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { duration, subscriptionTier } = req.body;
      
      if (!['free', 'premium'].includes(subscriptionTier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }
      
      let subscriptionEndDate = null;
      if (subscriptionTier === 'premium' && duration > 0) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);
        subscriptionEndDate = endDate.toISOString();
      }
      
      const updatedUser = await storage.updateUserSubscription(userId, {
        subscriptionTier,
        subscriptionEndDate
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Automatically manage restaurant active status based on new subscription
      const maxRestaurants = subscriptionTier === 'premium' ? 3 : 1;
      await storage.manageRestaurantsBySubscription(userId, maxRestaurants);
      
      // Create admin log for this action
      await storage.createAdminLog({
        adminId: (req.user as any).id,
        action: 'update_subscription',
        entityType: 'user',
        entityId: updatedUser.id,
        details: `Changed user ${updatedUser.username} subscription to ${subscriptionTier}${duration > 0 ? ` for ${duration} days` : ''} from IP ${req.ip}`,
      });
      
      // Exclude sensitive data
      const { password, resetPasswordToken, resetPasswordExpires, ...sanitizedUser } = updatedUser;
      
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get admin logs
  app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAdminLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Public pricing plans endpoint
  app.get('/api/pricing', async (req, res) => {
    try {
      const plans = await storage.getAllPricingPlans();
      // Only return active plans to the public endpoint
      const activePlans = plans.filter(plan => plan.isActive);
      res.json(activePlans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });
  
  // Get specific pricing plan by ID
  app.get('/api/pricing/:id', async (req, res) => {
    try {
      const planId = parseInt(req.params.id, 10);
      if (isNaN(planId)) {
        return res.status(400).json({ message: 'Invalid plan ID' });
      }
      
      const plan = await storage.getPricingPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      // Only return active plans to public
      if (!plan.isActive) {
        return res.status(404).json({ message: 'Pricing plan not available' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error fetching pricing plan:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });
  
  // Public contact info endpoint
  app.get('/api/contact-info', async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || {
        address: 'Ethiopia, Addis Abeba',
        email: 'menumate.spp@gmail.com',
        phone: '+251-913-690-687'
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Failed to load contact information' });
    }
  });
  
  // Pricing plans management (admin)
  app.get('/api/admin/pricing', isAdmin, async (req, res) => {
    try {
      // Get all pricing plans from storage
      const plans = await storage.getAllPricingPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      res.status(500).json({ message: 'Error loading pricing data' });
    }
  });

  app.post('/api/admin/pricing', isAdmin, async (req, res) => {
    try {
      // Validate and create a new pricing plan
      const plan = await storage.createPricingPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      res.status(500).json({ message: 'Failed to create pricing plan' });
    }
  });

  app.patch('/api/admin/pricing/:id', isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.updatePricingPlan(planId, req.body);
      
      if (!plan) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      res.status(500).json({ message: 'Failed to update pricing plan' });
    }
  });

  app.delete('/api/admin/pricing/:id', isAdmin, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const result = await storage.deletePricingPlan(planId);
      
      if (!result) {
        return res.status(404).json({ message: 'Pricing plan not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      res.status(500).json({ message: 'Failed to delete pricing plan' });
    }
  });

  // Admin subscription management routes
  app.post('/api/admin/users/:userId/subscription', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { duration, subscriptionTier } = req.body;
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      if (!subscriptionTier || !['free', 'premium'].includes(subscriptionTier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Calculate end date based on duration
      let subscriptionEndDate = null;
      if (subscriptionTier === 'premium' && duration > 0) {
        subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + duration);
      }
      
      // Update user subscription
      const updatedUser = await storage.updateUserSubscription(userId, {
        subscriptionTier,
        subscriptionEndDate: subscriptionEndDate ? subscriptionEndDate.toISOString() : null
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update subscription' });
      }
      
      res.json({
        success: true,
        user: updatedUser,
        message: `Subscription updated successfully`
      });
    } catch (error) {
      console.error('Error updating user subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });
  
  // Contact information management
  app.get('/api/admin/contact-info', isAdmin, async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || {
        address: 'Ethiopia, Addis Abeba',
        email: 'menumate.spp@gmail.com',
        phone: '+251-913-690-687'
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Failed to load contact information' });
    }
  });

  app.patch('/api/admin/contact-info', isAdmin, async (req, res) => {
    try {
      const { address, email, phone } = req.body;
      const updatedInfo = await storage.updateContactInfo({ address, email, phone });
      res.json(updatedInfo);
    } catch (error) {
      console.error('Error updating contact info:', error);
      res.status(500).json({ message: 'Failed to update contact information' });
    }
  });

  // Public endpoints for homepage content
  app.get('/api/menu-examples', async (req, res) => {
    try {
      const examples = await storage.getActiveMenuExamples();
      res.json(examples);
    } catch (error) {
      console.error('Error fetching menu examples:', error);
      res.status(500).json({ message: 'Failed to fetch menu examples' });
    }
  });

  app.get('/api/testimonials', async (req, res) => {
    try {
      const testimonials = await storage.getActiveTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  app.get('/api/contact-info', async (req, res) => {
    try {
      const contactInfo = await storage.getContactInfo();
      res.json(contactInfo || {
        address: 'Ethiopia, Addis Abeba',
        email: 'menumate.spp@gmail.com',
        phone: '+251-913-690-687'
      });
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ message: 'Failed to fetch contact information' });
    }
  });

  // Advertisement routes
  app.get('/api/admin/advertisements', isAdmin, async (req, res) => {
    try {
      const advertisements = await storage.getAdvertisements();
      res.json(advertisements);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      res.status(500).json({ message: 'Failed to fetch advertisements' });
    }
  });

  app.post('/api/admin/advertisements', isAdmin, async (req, res) => {
    try {
      // Add additional server-side validation for required fields
      if (!req.body.title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      // Log for debugging
      console.log('Creating advertisement with data:', {
        requestBody: req.body,
        user: req.user
      });
      
      // Process dates correctly
      let adData = { 
        ...req.body, 
        createdBy: (req.user as any).id
      };
      
      // Convert date strings to Date objects
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      const newAd = await storage.createAdvertisement(adData);
      console.log('Advertisement created successfully:', newAd);
      res.status(201).json(newAd);
    } catch (error) {
      console.error('Error creating advertisement:', error);
      res.status(500).json({ message: 'Failed to create advertisement', error: String(error) });
    }
  });

  app.patch('/api/admin/advertisements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let adData = { ...req.body };
      
      // Process dates correctly
      if (adData.startDate && typeof adData.startDate === 'string') {
        adData.startDate = new Date(adData.startDate);
      }
      
      if (adData.endDate && typeof adData.endDate === 'string') {
        adData.endDate = new Date(adData.endDate);
      }
      
      const updatedAd = await storage.updateAdvertisement(parseInt(id), adData);
      if (!updatedAd) {
        return res.status(404).json({ message: 'Advertisement not found' });
      }
      res.json(updatedAd);
    } catch (error) {
      console.error('Error updating advertisement:', error);
      res.status(500).json({ message: 'Failed to update advertisement' });
    }
  });

  app.delete('/api/admin/advertisements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdvertisement(parseInt(id));
      res.json({ message: 'Advertisement deleted successfully' });
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      res.status(500).json({ message: 'Failed to delete advertisement' });
    }
  });

  // Customer-facing advertisement API
  app.get('/api/advertisements', async (req, res) => {
    try {
      const { position, restaurantId } = req.query;
      if (!position) {
        return res.status(400).json({ message: 'Position parameter is required' });
      }
      
      let restaurant = null;
      
      // Check if this is for a premium restaurant
      if (restaurantId) {
        try {
          restaurant = await storage.getRestaurant(parseInt(restaurantId as string));
          
          if (restaurant) {
            // Check restaurant owner's subscription
            const ownerSubscription = await storage.getActiveSubscriptionByUserId(restaurant.userId);
            
            // If owner has premium subscription, don't show ads
            if (ownerSubscription && ownerSubscription.tier === "premium") {
              console.log(`Restaurant ${restaurantId} has premium subscription, not serving ads`);
              return res.json(null);
            }
          }
        } catch (error) {
          console.error("Error checking restaurant subscription:", error);
          // Continue to serve ads on error
        }
      }
      
      // Get advertisements for the specified position with targeting
      const advertisement = await storage.getTargetedAdvertisement(position as string, restaurant || null);
      res.json(advertisement);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
      res.status(500).json({ message: 'Failed to fetch advertisement' });
    }
  });

  // Create admin user
  app.post('/api/admin/users/create-admin', isAdmin, async (req, res) => {
    try {
      const { username, email, fullName, password } = req.body;
      
      // Basic validation
      if (!username || !email || !fullName || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // Create the admin user with bcrypt-hashed password
      // We can pass the plain password since our storage layer handles hashing
      const newAdmin = await storage.createUser({
        username,
        email,
        fullName,
        password, // Password hashing is handled inside storage implementation
        isAdmin: true,
        isActive: true
      });
      
      // Log admin creation
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      await storage.createAdminLog({
        adminId: adminUser.id,
        action: 'admin_created',
        entityType: 'user',
        entityId: newAdmin.id,
        details: { createdBy: adminUser.username, newAdminUsername: username }
      });
      
      // Return the new admin without password
      const { password: _, ...adminWithoutPassword } = newAdmin;
      res.status(201).json(adminWithoutPassword);
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Failed to create admin user' });
    }
  });

  // Admin profile update
  app.patch('/api/admin/profile', isAdmin, async (req, res) => {
    try {
      const { username, email, currentPassword, newPassword } = req.body;
      
      // Basic validation
      if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
      }
      
      // Get the current admin user
      const admin = await storage.getUser(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin user not found' });
      }
      
      // If changing password, verify the current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }
        
        // Verify current password
        const isPasswordCorrect = await storage.verifyPassword(admin.id, currentPassword);
        if (!isPasswordCorrect) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Update user with new password
        const updatedAdmin = await storage.updateUserWithPassword(admin.id, {
          username,
          email,
          password: newPassword
        });
        
        // Return updated user without password
        const { password, ...userWithoutPassword } = updatedAdmin;
        return res.json(userWithoutPassword);
      }
      
      // Update user without changing password
      const updatedAdmin = await storage.updateUser(admin.id, {
        username,
        email
      });
      
      // Return updated user without password
      const { password, ...userWithoutPassword } = updatedAdmin;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating admin profile:', error);
      res.status(500).json({ message: 'Failed to update admin profile' });
    }
  });

  // Admin login
  app.post('/api/auth/admin-login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      // Check if the user has admin privileges
      if (!user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Create admin log for successful login
        storage.createAdminLog({
          adminId: user.id,
          action: 'admin_login',
          entityType: 'user',
          details: `Admin logged in: ${user.username} from IP ${req.ip}`,
        }).catch(console.error);
        
        const { password, ...sanitizedUser } = user;
        return res.json(sanitizedUser);
      });
    })(req, res, next);
  });
  
  // Diagnostic endpoint to check file uploads directory
  app.get('/api/system/uploads-diagnostic', async (req, res) => {
    console.log('Running uploads directory diagnostic check');
    try {
      const results = {
        uploadsDirectory: {
          exists: false,
          isDirectory: false,
          writeable: false,
          stats: null as any,
          files: [] as string[],
          recentFiles: [] as any[],
        },
        serverInfo: {
          cwd: process.cwd(),
          tmpdir: os.tmpdir(),
          platform: process.platform,
          nodeVersion: process.version,
          requestUrl: req.protocol + '://' + req.get('host')
        }
      };
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      console.log(`Checking uploads directory at: ${uploadsDir}`);
      
      // Check if directory exists
      if (fs.existsSync(uploadsDir)) {
        results.uploadsDirectory.exists = true;
        
        try {
          const stats = fs.statSync(uploadsDir);
          results.uploadsDirectory.isDirectory = stats.isDirectory();
          results.uploadsDirectory.stats = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            permissions: stats.mode.toString(8),
          };
          
          // Test write permission
          try {
            const testFile = path.join(uploadsDir, `test-${Date.now()}.txt`);
            fs.writeFileSync(testFile, 'Test write permission');
            fs.unlinkSync(testFile); // Clean up test file
            results.uploadsDirectory.writeable = true;
          } catch (writeErr) {
            console.error('Write permission test failed:', writeErr);
            results.uploadsDirectory.writeable = false;
          }
          
          // List files in directory
          const files = fs.readdirSync(uploadsDir);
          results.uploadsDirectory.files = files;
          
          // Get details of most recent files (up to 5)
          const fileDetails = files
            .map(file => {
              const filePath = path.join(uploadsDir, file);
              try {
                const fileStats = fs.statSync(filePath);
                // Create an HTTP accessible URL for this file
                const httpUrl = `/uploads/${file}`;
                const fileInfo = {
                  name: file,
                  size: fileStats.size,
                  created: fileStats.birthtime,
                  accessTime: fileStats.atime,
                  exists: true,
                  accessible: true,
                  path: filePath,
                  url: httpUrl,
                  fullUrl: req.protocol + '://' + req.get('host') + httpUrl
                };
                return fileInfo;
              } catch (err) {
                return {
                  name: file,
                  exists: false,
                  error: err instanceof Error ? err.message : 'Unknown error'
                };
              }
            })
            .sort((a, b) => {
              if (a.created && b.created) {
                return b.created.getTime() - a.created.getTime();
              }
              return 0;
            })
            .slice(0, 5);
            
          results.uploadsDirectory.recentFiles = fileDetails;
          
          // Add diagnostics on HTTP access
          const baseUrl = req.protocol + '://' + req.get('host');
          results.uploadsDirectory.httpAccessTest = {
            baseUrl,
            testUrl: baseUrl + '/uploads',
            testedAt: new Date().toISOString()
          };
          
          // Create a test file to verify HTTP access
          const testFileName = `http-test-${Date.now()}.txt`;
          const testFilePath = path.join(uploadsDir, testFileName);
          try {
            fs.writeFileSync(testFilePath, 'Diagnostic HTTP test file');
            results.uploadsDirectory.httpAccessTest.testFile = {
              path: testFilePath,
              url: `/uploads/${testFileName}`,
              fullUrl: baseUrl + `/uploads/${testFileName}`,
              created: new Date().toISOString()
            };
            // File will be automatically accessible via the /uploads route
          } catch (testErr) {
            console.error('Failed to create HTTP test file:', testErr);
            results.uploadsDirectory.httpAccessTest.testFileError = 
              testErr instanceof Error ? testErr.message : 'Unknown error';
          }
        } catch (statErr) {
          console.error('Error getting uploads directory stats:', statErr);
        }
      } else {
        console.log('Uploads directory does not exist');
        
        // Try to create it
        try {
          fs.mkdirSync(uploadsDir, { recursive: true });
          console.log(`Created uploads directory at: ${uploadsDir}`);
          results.uploadsDirectory.exists = true;
          results.uploadsDirectory.isDirectory = true;
          results.uploadsDirectory.writeable = true;
        } catch (mkdirErr) {
          console.error('Failed to create uploads directory:', mkdirErr);
        }
      }
      
      res.json(results);
      
      // Clean up the test file after response is sent
      setTimeout(() => {
        const testFilePath = path.join(uploadsDir, `http-test-${Date.now()}.txt`);
        if (fs.existsSync(testFilePath)) {
          try {
            fs.unlinkSync(testFilePath);
            console.log(`Removed HTTP test file: ${testFilePath}`);
          } catch (err) {
            console.error(`Failed to remove HTTP test file: ${err}`);
          }
        }
      }, 60000); // Keep the file around for a minute for testing
    } catch (error) {
      console.error('Error during upload diagnostic:', error);
      res.status(500).json({ 
        message: 'Error performing uploads diagnostic',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Image system diagnostic route
  app.get('/api/system/image-diagnostic', async (req, res) => {
    try {
      // Check placeholder SVGs
      const placeholderResults = await Promise.all([
        checkFile(path.join(process.cwd(), 'public', 'placeholder-image.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-image-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-food.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-food-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-banner.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-banner-dark.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-logo.svg')),
        checkFile(path.join(process.cwd(), 'public', 'placeholder-logo-dark.svg'))
      ]);
      
      // Check uploads directory
      let uploadsInfo = {};
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const uploadsExists = fs.existsSync(uploadsDir);
        const uploadStats = uploadsExists ? fs.statSync(uploadsDir) : null;
        
        uploadsInfo = {
          exists: uploadsExists,
          isDirectory: uploadsExists && uploadStats?.isDirectory(),
          writeable: false,
          files: [],
          recentFiles: []
        };
        
        if (uploadsExists && uploadStats?.isDirectory()) {
          // Test write permissions
          try {
            const testFilePath = path.join(uploadsDir, `.test-${Date.now()}`);
            fs.writeFileSync(testFilePath, 'test');
            fs.unlinkSync(testFilePath);
            uploadsInfo.writeable = true;
          } catch (e) {
            uploadsInfo.writeable = false;
          }
          
          // Get file listing (limited to 100)
          try {
            const files = fs.readdirSync(uploadsDir);
            uploadsInfo.files = files.slice(0, 100);
            
            // Get 5 most recent files with details
            const fileDetails = files
              .map(file => {
                try {
                  const filePath = path.join(uploadsDir, file);
                  const stats = fs.statSync(filePath);
                  return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    accessTime: stats.atime,
                    exists: true,
                    accessible: true,
                    path: filePath,
                    url: `/uploads/${file}`,
                    fullUrl: `${req.protocol}://${req.get('host')}/uploads/${file}`
                  };
                } catch (e) {
                  return {
                    name: file,
                    exists: false,
                    error: e.message
                  };
                }
              })
              .filter(file => file.exists && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
              .sort((a, b) => {
                if (a.created && b.created) {
                  return b.created.getTime() - a.created.getTime();
                }
                return 0;
              })
              .slice(0, 5);
              
            uploadsInfo.recentFiles = fileDetails;
            
            // Test HTTP accessibility of recent files
            for (const file of fileDetails) {
              try {
                const url = `${req.protocol}://${req.get('host')}/uploads/${file.name}`;
                const response = await fetch(url, { method: 'HEAD' });
                file.httpAccessTest = {
                  url,
                  status: response.status,
                  ok: response.ok,
                  headers: Object.fromEntries(response.headers.entries())
                };
              } catch (e) {
                file.httpAccessTest = {
                  error: e.message
                };
              }
            }
          } catch (e) {
            uploadsInfo.fileListError = e.message;
          }
        }
      } catch (e) {
        uploadsInfo.error = e.message;
      }
      
      // Get server details
      const serverInfo = {
        hostname: req.hostname,
        protocol: req.protocol,
        headers: req.headers,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      };
      
      res.json({
        timestamp: new Date().toISOString(),
        placeholders: placeholderResults,
        uploads: uploadsInfo,
        server: serverInfo
      });
    } catch (error) {
      console.error('Error generating image diagnostics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Helper function to check if a file exists and get its stats
  async function checkFile(filePath: string): Promise<any> {
    try {
      const exists = fs.existsSync(filePath);
      if (!exists) {
        return {
          path: filePath,
          exists: false,
          error: 'File does not exist'
        };
      }
      
      const stats = fs.statSync(filePath);
      return {
        path: filePath,
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        filename: path.basename(filePath)
      };
    } catch (error) {
      return {
        path: filePath,
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Ad settings API routes for admin control of advertisement positioning
  app.get('/api/admin/ad-settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdSettings();
      if (!settings) {
        // Return default settings if none exist
        const defaultSettings = {
          id: 1,
          position: "bottom",
          isEnabled: true,
          description: "Where the advertisement will be displayed on the menu.",
          displayFrequency: 1,
          maxAdsPerPage: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        res.json(defaultSettings);
      } else {
        res.json(settings);
      }
    } catch (error) {
      console.error('Error fetching ad settings:', error);
      res.status(500).json({ message: 'Failed to fetch ad settings' });
    }
  });

  app.put('/api/admin/ad-settings', isAdmin, async (req, res) => {
    try {
      const { position, isEnabled, displayFrequency, maxAdsPerPage } = req.body;

      // Validate input
      const validPositions = ['top', 'middle', 'bottom', 'sidebar'];
      if (position && !validPositions.includes(position)) {
        return res.status(400).json({ message: 'Invalid position. Must be one of: top, middle, bottom, sidebar' });
      }

      if (displayFrequency && (displayFrequency < 1 || displayFrequency > 20)) {
        return res.status(400).json({ message: 'Display frequency must be between 1 and 20' });
      }

      if (maxAdsPerPage && (maxAdsPerPage < 1 || maxAdsPerPage > 10)) {
        return res.status(400).json({ message: 'Max ads per page must be between 1 and 10' });
      }

      const updatedSettings = await storage.updateAdSettings({
        position,
        isEnabled,
        displayFrequency,
        maxAdsPerPage
      } as any);

      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating ad settings:', error);
      res.status(500).json({ message: 'Failed to update ad settings' });
    }
  });

  // Menu item analytics API - track which items customers click most
  app.post('/api/menu-items/:id/track-click', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: 'Invalid menu item ID' });
      }

      await storage.incrementMenuItemClicks(itemId);
      res.json({ success: true, message: 'Click tracked successfully' });
    } catch (error) {
      console.error('Error tracking menu item click:', error);
      res.status(500).json({ message: 'Failed to track click' });
    }
  });

  app.get('/api/restaurants/:id/menu-analytics', isAuthenticated, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: 'Invalid restaurant ID' });
      }

      // Check if user owns this restaurant
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // For admin users, allow access to any restaurant
      const user = req.user as any;
      if (!user.isAdmin && restaurant.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const analytics = await storage.getMenuItemAnalytics(restaurantId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching menu analytics:', error);
      res.status(500).json({ message: 'Failed to fetch menu analytics' });
    }
  });

  // Admin routes for managing homepage content
  const adminOnly = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user as any;
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  };

  // Menu Examples Management Routes
  app.get('/api/admin/menu-examples', adminOnly, async (req, res) => {
    try {
      const examples = await storage.getMenuExamples();
      res.json(examples);
    } catch (error) {
      console.error('Error fetching menu examples:', error);
      res.status(500).json({ message: 'Failed to fetch menu examples' });
    }
  });

  app.post('/api/admin/menu-examples', adminOnly, async (req, res) => {
    try {
      const example = await storage.createMenuExample(req.body);
      res.status(201).json(example);
    } catch (error) {
      console.error('Error creating menu example:', error);
      res.status(500).json({ message: 'Failed to create menu example' });
    }
  });

  app.patch('/api/admin/menu-examples/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid example ID' });
      }
      
      const example = await storage.updateMenuExample(id, req.body);
      if (!example) {
        return res.status(404).json({ message: 'Menu example not found' });
      }
      
      res.json(example);
    } catch (error) {
      console.error('Error updating menu example:', error);
      res.status(500).json({ message: 'Failed to update menu example' });
    }
  });

  app.delete('/api/admin/menu-examples/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid example ID' });
      }
      
      await storage.deleteMenuExample(id);
      res.json({ message: 'Menu example deleted successfully' });
    } catch (error) {
      console.error('Error deleting menu example:', error);
      res.status(500).json({ message: 'Failed to delete menu example' });
    }
  });

  // Testimonials Management Routes
  app.get('/api/admin/testimonials', adminOnly, async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  app.post('/api/admin/testimonials', adminOnly, async (req, res) => {
    try {
      const testimonial = await storage.createTestimonial(req.body);
      res.status(201).json(testimonial);
    } catch (error) {
      console.error('Error creating testimonial:', error);
      res.status(500).json({ message: 'Failed to create testimonial' });
    }
  });

  app.patch('/api/admin/testimonials/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      const testimonial = await storage.updateTestimonial(id, req.body);
      if (!testimonial) {
        return res.status(404).json({ message: 'Testimonial not found' });
      }
      
      res.json(testimonial);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      res.status(500).json({ message: 'Failed to update testimonial' });
    }
  });

  app.delete('/api/admin/testimonials/:id', adminOnly, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid testimonial ID' });
      }
      
      await storage.deleteTestimonial(id);
      res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      res.status(500).json({ message: 'Failed to delete testimonial' });
    }
  });

  // Public routes for homepage content
  app.get('/api/menu-examples', async (req, res) => {
    try {
      const examples = await storage.getActiveMenuExamples();
      res.json(examples);
    } catch (error) {
      console.error('Error fetching active menu examples:', error);
      res.status(500).json({ message: 'Failed to fetch menu examples' });
    }
  });

  app.get('/api/testimonials', async (req, res) => {
    try {
      const testimonials = await storage.getActiveTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error('Error fetching active testimonials:', error);
      res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
  });

  // Note: Frontend routing is handled by Vite middleware in development

  const httpServer = createServer(app);
  return httpServer;
}