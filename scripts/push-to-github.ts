// Script to push project to GitHub
import { getUncachableGitHubClient } from '../server/github-client';
import { execSync } from 'child_process';

async function pushToGitHub() {
  try {
    console.log('🔗 Connecting to GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const repoName = 'VividPlate';
    const repoDescription = 'VividPlate - Digital Restaurant Menu Platform with QR codes, multi-language support, and Chapa payment integration';
    
    // Check if repo exists
    let repoExists = false;
    try {
      await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repoExists = true;
      console.log(`📁 Repository ${repoName} already exists`);
    } catch (error: any) {
      if (error.status === 404) {
        console.log(`📁 Repository ${repoName} does not exist, creating...`);
      } else {
        throw error;
      }
    }
    
    // Create repo if it doesn't exist
    if (!repoExists) {
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: repoDescription,
        private: false,
        auto_init: false,
      });
      console.log(`✅ Created repository: ${repoName}`);
    }
    
    // Get the access token for git operations
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    const connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken!
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
    
    // Configure git
    const remoteUrl = `https://${accessToken}@github.com/${user.login}/${repoName}.git`;
    
    console.log('📝 Configuring git...');
    
    try {
      execSync('git config user.email "vividplate@users.noreply.github.com"', { stdio: 'pipe' });
      execSync('git config user.name "VividPlate"', { stdio: 'pipe' });
    } catch (e) {
      // Ignore if already configured
    }
    
    // Remove existing remote if it exists
    try {
      execSync('git remote remove github', { stdio: 'pipe' });
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    // Add remote
    execSync(`git remote add github "${remoteUrl}"`, { stdio: 'pipe' });
    console.log('✅ Added GitHub remote');
    
    // Commit any uncommitted changes
    try {
      execSync('git add -A', { stdio: 'pipe' });
      execSync('git commit -m "VividPlate: Digital Restaurant Menu Platform"', { stdio: 'pipe' });
      console.log('✅ Committed changes');
    } catch (e) {
      console.log('ℹ️ No new changes to commit');
    }
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    execSync('git push -u github main --force', { stdio: 'inherit' });
    
    console.log(`\n✅ Successfully pushed to GitHub!`);
    console.log(`🔗 Repository URL: https://github.com/${user.login}/${repoName}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

pushToGitHub();
