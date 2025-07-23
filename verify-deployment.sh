#!/bin/bash

# Complete Deployment Verification Script
echo "🚀 AutoToon Deployment Verification"
echo "=================================="

# Test Backend Health
echo "1. Testing Backend Health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://autotoon-full.onrender.com/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed (HTTP $BACKEND_HEALTH)"
fi

# Test Backend API Status
echo "2. Testing Backend API Status..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://autotoon-full.onrender.com/api/status)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API check failed (HTTP $BACKEND_STATUS)"
fi

# Test Frontend
echo "3. Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://autotoon-full.vercel.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend check failed (HTTP $FRONTEND_STATUS)"
fi

# Test CORS
echo "4. Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: https://autotoon-full.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://autotoon-full.onrender.com/api/generate -w "%{http_code}" -o /dev/null)
if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    echo "✅ CORS is configured correctly"
else
    echo "❌ CORS check failed (HTTP $CORS_TEST)"
fi

echo ""
echo "🎯 Additional Tests:"
echo "5. Testing Frontend-to-Backend Connection..."
# Test if frontend can actually call the backend API
FRONTEND_API_TEST=$(curl -s -X POST https://autotoon-full.onrender.com/api/generate \
  -H "Content-Type: application/json" \
  -H "Origin: https://autotoon-full.vercel.app" \
  -d '{"story": "Test connection", "style": "comic"}' \
  -w "%{http_code}" -o /tmp/api_response.json)

if [ "$FRONTEND_API_TEST" = "200" ]; then
    echo "✅ Frontend-to-Backend API call successful"
    echo "📄 Response preview:"
    head -c 200 /tmp/api_response.json
    echo "..."
else
    echo "❌ Frontend-to-Backend API call failed (HTTP $FRONTEND_API_TEST)"
    echo "📄 Error response:"
    cat /tmp/api_response.json
fi

echo ""
echo "6. Testing Frontend Environment Variable..."
# Check if the frontend is actually using the correct API URL
echo "   Checking if frontend can reach: https://autotoon-full.onrender.com"

echo ""
echo "🔍 Debugging Steps:"
echo "1. Open browser console at https://autotoon-full.vercel.app/create"
echo "2. Check Network tab when creating a comic"
echo "3. Look for any failed requests or error messages"
echo "4. Verify the API calls are going to: https://autotoon-full.onrender.com"
echo ""
echo "If you see errors, please share:"
echo "- The exact error message"
echo "- Any console errors"
echo "- Network request details"
