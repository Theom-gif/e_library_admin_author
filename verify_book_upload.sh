#!/bin/bash
# Book Upload Verification Script
# Run this in your Laravel backend to diagnose the upload/retrieval issue

echo "================================================"
echo "Book Upload & Retrieval Verification"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Database schema
echo -e "${YELLOW}[1] Checking database schema...${NC}"
mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" -e "DESCRIBE books;" 2>/dev/null | grep -E "author_id|author_name|user_id|pdf_path" || echo -e "${RED}❌ Missing expected columns${NC}"

# Check 2: Sample book data
echo ""
echo -e "${YELLOW}[2] Checking for books in database...${NC}"
mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" -e "SELECT id, title, author_name, user_id, pdf_path FROM books LIMIT 3;" 2>/dev/null || echo -e "${RED}❌ Unable to query books${NC}"

# Check 3: Test the query that's failing
echo ""
echo -e "${YELLOW}[3] Testing the failing query (author_id lookup)...${NC}"
RESULT=$(mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" -e "SELECT * FROM books WHERE author_id = 7;" 2>&1)
if echo "$RESULT" | grep -q "Unknown column"; then
    echo -e "${RED}❌ CONFIRMED: author_id column does not exist${NC}"
else
    echo -e "${GREEN}✅ author_id column exists${NC}"
fi

# Check 4: Test the correct query
echo ""
echo -e "${YELLOW}[4] Testing correct query (user_id lookup)...${NC}"
mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" -e "SELECT id, title, author_name, user_id FROM books WHERE user_id = 7 LIMIT 3;" 2>/dev/null || echo -e "${RED}❌ Unable to query by user_id${NC}"

# Check 5: Test API endpoint
echo ""
echo -e "${YELLOW}[5] Testing API endpoint GET /api/auth/books...${NC}"
TOKEN=$(php artisan tinker --execute="echo Auth::loginUsingId(7)->remember_token;" 2>/dev/null)
curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "http://localhost:8000/api/auth/books" | jq '.' 2>/dev/null || echo -e "${RED}❌ API endpoint failed${NC}"

# Check 6: Check controller method
echo ""
echo -e "${YELLOW}[6] Checking BookController for author_id references...${NC}"
if grep -r "author_id" app/Http/Controllers/BookController.php 2>/dev/null; then
    echo -e "${RED}❌ Found author_id reference (should be removed)${NC}"
else
    echo -e "${GREEN}✅ No author_id references found${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo "Verification complete!"
echo "================================================"
