#!/bin/bash

# AI Document Analyzer - Quick Deploy Script
# This script helps you deploy to Render and Vercel

set -e

echo "🚀 AI Document Analyzer - Deployment Script"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Check if changes are committed
if [[ -n $(git status -s) ]]; then
    echo -e "${BLUE}📝 You have uncommitted changes.${NC}"
    read -p "Commit all changes? (y/n): " commit_choice
    if [[ $commit_choice == "y" ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    fi
fi

# Push to GitHub
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Instructions
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1️⃣  Deploy Backend to Render:"
echo "   - Go to https://render.com"
echo "   - Connect your GitHub repo"
echo "   - Select 'backend-unified'"
echo "   - Add environment variables"
echo ""
echo "2️⃣  Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repo"
echo "   - Select 'frontend'"
echo "   - Add environment variables"
echo ""
echo "3️⃣  Update CORS:"
echo "   - Add Vercel URL to backend FRONTEND_URL"
echo "   - Add Vercel URL to Clerk domains"
echo ""

read -p "Press Enter to open Render dashboard..." 
open https://render.com/dashboard || xdg-open https://render.com/dashboard || start https://render.com/dashboard

echo ""
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo -e "${BLUE}📚 See DEPLOYMENT_GUIDE.md for detailed instructions${NC}"
