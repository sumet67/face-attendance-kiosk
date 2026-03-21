<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Face Attendance Kiosk AI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- เพิ่ม face-api.js จาก CDN -->
    <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body {
        margin: 0;
        font-family: 'Inter', sans-serif;
        background-color: #020617;
      }
      .scanner-line {
        height: 2px;
        background: linear-gradient(90deg, transparent, #6366f1, transparent);
        box-shadow: 0 0 15px #6366f1;
        position: absolute;
        width: 100%;
        animation: scan 3s infinite ease-in-out;
      }
      @keyframes scan {
        0%, 100% { top: 0%; }
        50% { top: 100%; }
      }
    </style>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>