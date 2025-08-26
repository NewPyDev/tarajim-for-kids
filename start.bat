@echo off
echo Starting Tarajim for Kids Server...
echo.
echo Make sure Node.js is installed on your system.
echo Default admin credentials: username=admin, password=123456
echo.
echo Server will start on http://localhost:3000
echo Admin panel: http://localhost:3000/admin/login.html
echo.
node server/app.js
pause