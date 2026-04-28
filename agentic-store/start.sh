#!/bin/sh
cd /app/.medusa/server
/app/node_modules/.bin/medusa db:migrate
/app/node_modules/.bin/medusa start -p 9001
