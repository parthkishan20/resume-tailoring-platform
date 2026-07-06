# scripts/stop_windows.ps1 — Stop ResumeTailor (Windows PowerShell)
$ErrorActionPreference = "Stop"

$ContainerName = "resumetailor"

$existing = docker ps -a --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
if ($existing) {
    Write-Host "Stopping ResumeTailor..."
    docker stop $ContainerName
    docker rm $ContainerName
    Write-Host "Stopped. Your data is preserved in Docker volumes (resumedb-data, resumepdf-data)."
} else {
    Write-Host "ResumeTailor is not running."
}
