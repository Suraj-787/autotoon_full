#!/bin/bash

echo "🧪 Testing Complete Comic Creation and PDF Export Flow"
echo "====================================================="

# Step 1: Generate a comic story
echo "1. Generating comic story..."
GENERATE_RESPONSE=$(curl -s -X POST https://autotoon-full.onrender.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{"story": "A brave firefighter saves a kitten from a tree", "style": "cartoon"}')

SESSION_ID=$(echo "$GENERATE_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$SESSION_ID" ]; then
    echo "✅ Story generated successfully"
    echo "📋 Session ID: $SESSION_ID"
else
    echo "❌ Failed to generate story"
    echo "Response: $GENERATE_RESPONSE"
    exit 1
fi

# Step 2: Generate images
echo ""
echo "2. Generating images..."
sleep 2
IMAGES_RESPONSE=$(curl -s -X POST https://autotoon-full.onrender.com/api/images \
  -H "Content-Type: application/json" \
  -d "{\"prompts\": [\"A brave firefighter climbs a ladder to save a kitten from a tree\"], \"sessionId\": \"$SESSION_ID\"}")

IMAGES_SUCCESS=$(echo "$IMAGES_RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2)

if [ "$IMAGES_SUCCESS" = "true" ]; then
    echo "✅ Images generated successfully"
    echo "📷 Response: $(echo "$IMAGES_RESPONSE" | head -c 100)..."
else
    echo "❌ Failed to generate images"
    echo "Response: $IMAGES_RESPONSE"
    exit 1
fi

# Step 3: Wait a moment for images to be processed
echo ""
echo "3. Waiting for image processing..."
sleep 3

# Step 4: Export PDF
echo ""
echo "4. Testing PDF export..."
EXPORT_RESPONSE=$(curl -s -X POST https://autotoon-full.onrender.com/api/export \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"dpi\": 100}" \
  -w "%{http_code}" -o /tmp/export_test.pdf)

if [ "$EXPORT_RESPONSE" = "200" ]; then
    echo "✅ PDF export successful!"
    
    # Check if PDF file was downloaded
    if [ -f "/tmp/export_test.pdf" ]; then
        PDF_SIZE=$(wc -c < /tmp/export_test.pdf)
        echo "📄 PDF downloaded successfully"
        echo "📊 PDF size: $PDF_SIZE bytes"
        
        # Check if it's a valid PDF (starts with %PDF)
        if head -c 4 /tmp/export_test.pdf | grep -q "%PDF"; then
            echo "✅ PDF file is valid"
        else
            echo "⚠️ Downloaded file might not be a valid PDF"
        fi
    else
        echo "⚠️ PDF export returned 200 but no file downloaded"
    fi
else
    echo "❌ PDF export failed (HTTP $EXPORT_RESPONSE)"
    
    # Try to get error details
    ERROR_RESPONSE=$(curl -s -X POST https://autotoon-full.onrender.com/api/export \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\": \"$SESSION_ID\", \"dpi\": 100}")
    
    echo "📋 Error details: $ERROR_RESPONSE"
fi

# Step 5: Test library
echo ""
echo "5. Checking library for saved comic..."
LIBRARY_RESPONSE=$(curl -s -X GET https://autotoon-full.onrender.com/api/library)
COMIC_COUNT=$(echo "$LIBRARY_RESPONSE" | grep -o '"comics":\[' | wc -l)

if [ "$COMIC_COUNT" -gt 0 ]; then
    echo "✅ Comic saved to library"
    echo "📚 Library response preview: $(echo "$LIBRARY_RESPONSE" | head -c 200)..."
else
    echo "⚠️ Comic might not be saved to library"
fi

echo ""
echo "🏁 Test completed!"
echo ""
echo "💡 To test manually:"
echo "1. Go to https://autotoon-full.vercel.app/create"
echo "2. Create a comic with story and images"
echo "3. Try downloading the PDF"
echo "4. Check browser dev tools for any errors"
