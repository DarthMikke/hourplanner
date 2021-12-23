#!/bin/sh

echo "Copying static files..."
rsync -a build/static/ ../static/
echo "Making a copy of app.html..."
mv ../templates/planner/app.html ../templates/planner/app.old.html
echo "Copying new app.html"
cp build/index.html ../templates/planner/app.html
