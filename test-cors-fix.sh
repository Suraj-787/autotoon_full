#!/bin/bash

echo "🔄 Monitoring Backend Deployment and Testing CORS Fix"
echo "======================================================"

# Function to test CORS
test_cors() {
    echo "Testing CORS from Vercel to Render..."
    
    # Test preflight request
    PREFLIGHT_RESPONSE=$(curl -s -I -X OPTIONS \
        -H "Origin: https://autotoon-full.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        https://autotoon-full.onrender.com/api/generate)
    
    if echo "$PREFLIGHT_RESPONSE" | grep -qi "access-control-allow-origin"; then
        echo "✅ CORS preflight request successful"
        echo "✅ Access-Control-Allow-Origin header found"
        echo "   Origin: $(echo "$PREFLIGHT_RESPONSE" | grep -i access-control-allow-origin)"
        return 0
    else
        echo "❌ CORS preflight request failed"
        echo "Response headers:"
        echo "$PREFLIGHT_RESPONSE"
        return 1
    fi
}

# Function to test actual API call
test_api_call() {
    echo "Testing actual API call..."
    
    RESPONSE=$(curl -s -X POST https://autotoon-full.onrender.com/api/generate \
        -H "Content-Type: application/json" \
        -H "Origin: https://autotoon-full.vercel.app" \
        -d '{"story": "CORS test story", "style": "comic"}' \
        -w "%{http_code}" -o /tmp/cors_test_response.json)
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ API call successful"
        echo "📄 Response preview:"
        head -c 100 /tmp/cors_test_response.json
        echo "..."
        return 0
    else
        echo "❌ API call failed (HTTP $RESPONSE)"
        cat /tmp/cors_test_response.json
        return 1
    fi
}

# Wait for deployment and test
echo "⏱️  Waiting for backend deployment to complete..."
sleep 30

echo ""
echo "🧪 Testing CORS Configuration..."

if test_cors; then
    echo ""
    if test_api_call; then
        echo ""
        echo "🎉 SUCCESS! CORS is now working correctly!"
        echo ""
        echo "✅ Next steps:"
        echo "1. Go to https://autotoon-full.vercel.app/create"
        echo "2. Try creating a comic - it should work now!"
        echo "3. If it still doesn't work, try a hard refresh (Ctrl+F5 or Cmd+Shift+R)"
    else
        echo ""
        echo "⚠️  CORS preflight works, but API call still failing"
    fi
else
    echo ""
    echo "⚠️  CORS preflight still failing. Deployment might still be in progress."
    echo "   Try again in 1-2 minutes."
fi

echo ""
echo "🔍 You can also manually test by:"
echo "   1. Opening https://autotoon-full.vercel.app/create"
echo "   2. Opening browser dev tools (F12)"
echo "   3. Trying to create a comic"
echo "   4. Checking for CORS errors in console"
