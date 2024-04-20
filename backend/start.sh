#!/bin/sh

set -ex
cd backend
npx prisma migrate deploy
npm run start