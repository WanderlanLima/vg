@echo off
chcp 65001 >nul
echo ========================================================
echo Enviando arquivos e atualizacoes para o GitHub...
echo ========================================================

git add .
git commit -m "Atualizacao do projeto"
git push

echo.
echo ========================================================
echo Concluido! Suas alteracoes foram enviadas com sucesso.
echo O GitHub Actions vai atualizar o site em alguns minutos.
echo ========================================================
pause
