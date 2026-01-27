import { storage } from '../server/storage';

(async () => {
  try {
    console.log('Starting test flows...');

    // Find a test user (fallback to id 2 if not found)
    let user = await storage.getUserByUsername('restaurant1');
    if (!user) {
      user = await storage.getUser(2 as any);
    }
    if (!user) {
      console.error('No test user available to run flows');
      process.exit(1);
    }

    // Resolve default agent via storage by username/email fallback
    let agentId: number | null = null;
    const defaultUser = await storage.getUserByUsername('Agent1') || await storage.getUserByEmail('michaellegesse.gm@gmail.com');
    if (defaultUser) {
      const agentRecord = await storage.getAgentByUserId(defaultUser.id);
      if (agentRecord) agentId = agentRecord.id;
    }
    agentId = agentId || 1;

    console.log('Using user id:', user.id, 'agentId:', agentId);

    // Create a restaurant request
    try {
      const req = await storage.createRestaurantRequest({
        ownerUserId: user.id,
        agentId,
        restaurantName: user.fullName || user.username || 'Test Restaurant',
        restaurantDescription: 'Automated test premium renewal',
        cuisine: 'Test',
        requestedMonths: 3,
        ownerNotes: 'Test run'
      } as any);
      console.log('createRestaurantRequest result:', req);
    } catch (err) {
      console.error('createRestaurantRequest failed:', err);
    }

    // Create an agent message
    try {
      const msg = await storage.createAgentMessage({
        ownerUserId: user.id,
        agentId,
        subject: 'Test message',
        message: 'Hello agent, this is a test message.'
      } as any);
      console.log('createAgentMessage result:', msg);
    } catch (err) {
      console.error('createAgentMessage failed:', err);
    }

    process.exit(0);
  } catch (error) {
    console.error('Test flows crashed:', error);
    process.exit(1);
  }
})();
