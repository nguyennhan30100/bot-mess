@echo off
cd /d "F:\nhtn-bot"
pm2 start index.js --name "nhtn-bot"
pm2 save
pause