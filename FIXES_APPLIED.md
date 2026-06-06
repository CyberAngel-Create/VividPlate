# Issues Found and Fixes Applied

## Issue 1: DATABASE_URL Environment Variable Not Set in Deployment

**Problem**: The Cloud Run deployment is failing because `DATABASE_URL` is not being passed to the container.

**Root Cause**: Secrets in Secret Manager are not being accessed by Cloud Build.

**Fix**: 
1. Ensure secrets are created in Secret Manager
2. Grant Cloud Run service account permission to access secrets
3. Verify cloudbuild.yaml is correctly configured

See DEPLOYMENT_CHECKLIST.md for setup instructions.

---

## Issue 2: Agent Registration and Token Request Flow

**Analysis**: The endpoints for agent token requests and admin approvals are correctly implemented in the server, but there may be issues with:

1. **Agent Not Being Associated with User**: When a user registers as an agent, they need to have an associated record in the `agents` table. This needs to happen before they can request tokens.

2. **Missing Agent Record**: If a user tries to request tokens without having an agent record, the `createTokenRequest` will fail because `agentId` is required.

**Fix**: When users register as agents, they should automatically have an agent record created (or explicitly create one through agent registration endpoint).

---

## Issue 3: Registration Data Not Being Captured Correctly

**Problem**: The registration endpoint accepts `role` parameter but doesn't seem to use it to create agent records.

**Fix**: Add logic to automatically create an agent record when a user registers as an agent.

---

## Issue 4: Token Request API Issues

**Symptoms**:
- Token request endpoint `/api/agents/me/token-requests` returns 403 (Forbidden)
- This could happen if:
  - User is not authenticated
  - User doesn't have an agent record
  - User's agent status is not "approved"

**Current Code Check**: Line 5242 in routes.ts:
```typescript
if (!agent || agent.approvalStatus !== 'approved') {
  res.status(403).send({ message: 'Only approved agents can request tokens' });
}
```

This is correct - only approved agents can request tokens.

---

## Issue 5: Admin Token Approval API Issues

**Symptoms**:
- Admin can't approve token requests
- Possible causes:
  - Admin user doesn't have `isAdmin` flag set
  - Token request ID is incorrect
  - Database transaction failure

**Fix**: Ensure admin user has `isAdmin: true` in the database.

---

## Required Database Setup

Before deployment, ensure:

1. **Agents Table** exists with foreign key to users table:
```sql
CREATE TABLE IF NOT EXISTS agents (
  id serial PRIMARY KEY,
  user_id integer NOT NULL UNIQUE,
  -- ... other columns ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

2. **Token Requests Table** exists:
```sql
CREATE TABLE IF NOT EXISTS token_requests (
  id serial PRIMARY KEY,
  agent_id integer NOT NULL,
  requested_tokens integer NOT NULL,
  status text DEFAULT 'pending',
  -- ... other columns ...
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

3. **Token Transactions Table** exists:
```sql
CREATE TABLE IF NOT EXISTS token_transactions (
  id serial PRIMARY KEY,
  agent_id integer NOT NULL,
  -- ... other columns ...
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

Migration script: `scripts/migrate-agent-tokens.mjs`

---

## Deployment Steps

1. **Create secrets in GCP Secret Manager** (see DEPLOYMENT_CHECKLIST.md)
2. **Grant service account permissions** (see DEPLOYMENT_CHECKLIST.md)
3. **Deploy**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml --project white-notch-467408-e9
   ```
4. **Monitor**:
   ```bash
   gcloud run logs read vividplate --region us-central1 --limit 50 --follow
   ```

