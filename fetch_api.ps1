try {
    $response = Invoke-RestMethod -Uri "https://decklog-en.bushiroad.com/system/app/api/view/1U2W1" -Method Post
    $response | ConvertTo-Json -Depth 10 | Out-File "c:\Users\wande\OneDrive\Área de Trabalho\VG Proxy\api_out.json"
} catch {
    $_.Exception.Message | Out-File "c:\Users\wande\OneDrive\Área de Trabalho\VG Proxy\api_out.json"
}
