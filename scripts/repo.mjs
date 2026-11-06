// The GitHub repository this site deploys from: GITHUB_REPOSITORY in Actions,
// otherwise the git remote. Drives `site` and `base` (project Pages URL).
import { execSync } from 'node:child_process';

export function repo() {
  let slug = process.env.GITHUB_REPOSITORY;
  if (!slug) {
    try {
      const url = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
      const m = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
      if (m) slug = `${m[1]}/${m[2]}`;
    } catch {
      /* not a git checkout */
    }
  }
  if (!slug) throw new Error('Cannot determine the GitHub repository (set GITHUB_REPOSITORY=owner/repo).');
  const [owner, name] = slug.split('/');
  return { owner, name, site: `https://${owner.toLowerCase()}.github.io`, base: `/${name}` };
}
