// GitHub Client - Deploy connectors GitHub integration
import { Octokit } from '@octokit/rest';

async function getAccessToken() {
  const accessToken = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('GitHub access token not found. Set GITHUB_TOKEN or GITHUB_ACCESS_TOKEN.');
  }

  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}
