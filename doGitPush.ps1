param(
    [string]$folderPath,  # Folder containing new files from Pi
    [string]$repoName     # Name of Repo
)
Write-Host "Starting GitHub push for repo: $repoName"
Write-Host "Folder with new files: $folderPath"
# Adjust path as needed-------------------------------------
$localRepoPath = "C:\GitHubRepos\$repoName"
if (!(Test-Path $localRepoPath)) {
    Write-Host "Local repo path not found: $localRepoPath"
    exit 1
}
# Copy new/updated files into the local repo
Copy-Item -Path "$folderPath\*" -Destination $localRepoPath -Recurse -Force

Set-Location -Path $localRepoPath
git add .

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
git commit -m "Automated upload from Pi at $timestamp"

git push origin main

Write-Host "Upload to GitHub complete."
