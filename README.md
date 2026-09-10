# BlackCube Backend

Backend API for the BlackCube Admin Hub.

## Technology Stack
- Node.js
- Express
- TypeScript
- MongoDB Atlas (Mongoose)
- Zod

## Project Structure
- `src/config` - Configuration and database connections
- `src/controllers` - Request handlers
- `src/middleware` - Express middleware
- `src/models` - Mongoose schemas
- `src/routes` - API routes
- `src/services` - Business logic
- `src/validators` - Zod validation schemas
- `src/utils` - Helper functions

## Local Setup
1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and configure variables
4. Run `npm run dev`

## Environment Variables
- `PORT` - Server port
- `MONGODB_URI` - MongoDB Atlas connection string
- `CLIENT_ORIGIN` - CORS allowed origin
- `NODE_ENV` - development or production

## Commands
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to dist/
- `npm run start` - Start production server
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Run ESLint

## API Endpoints
- `GET /api/health` - Check API status
