git add .
git commit -m "feat: implement AI crop disease prediction system"
git pull origin main --no-edit
git push origin main
npx vercel --prod --yes
