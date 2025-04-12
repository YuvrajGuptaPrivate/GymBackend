🏋️‍♂️ Gym Management Backend
This is the backend service for the Gym Management Application. It provides APIs to manage client details, workout plans, attendance tracking, diet plans, and payment history.

Built using Node.js, Express.js, and MongoDB (with Mongoose).

🚀 Features
✅ Client registration and login

📅 Track daily attendance

🏃 Workout plan with exercises per day

🥗 Diet plan with macronutrient breakdown

💳 Payment history and status tracking

📊 Admin and client dashboard endpoints

🛠 Tech Stack
Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

Multer (for image uploads)

Dotenv for environment management

📂 Project Structure
bash
Copy
Edit
GymBackend/
├── config/             # MongoDB connection
├── controllers/        # Business logic for routes
├── models/             # Mongoose schemas
├── routes/             # API endpoints
├── middleware/         # JWT auth and other middlewares
├── uploads/            # Uploaded images (e.g. profile photos)
├── .env                # Environment variables
├── index.js            # Entry point
└── package.json

⚙️ Getting Started
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/YuvrajGuptaPrivate/GymBackend.git
cd GymBackend
2. Install Dependencies
bash
Copy
Edit
npm install
3. Setup Environment Variables
Create a .env file in the root directory:


📬 API Endpoints
Full API documentation coming soon...

Auth
POST /api/auth/register — Register a new client

POST /api/auth/login — Login and get token

Client
GET /api/client/:id — Get client profile

PUT /api/client/:id — Update client profile

Attendance
POST /api/attendance/mark — Mark attendance

GET /api/attendance/:clientId — Get attendance history

Workout
GET /api/workout/:clientId — Get daily workout plan

Diet
GET /api/diet/:clientId — Get client diet plan

Payment
GET /api/payment/:clientId — Get payment history

🔐 Authentication
All protected routes require a JWT token.
Send it in headers:

makefile
Copy
Edit
Authorization: Bearer <token>
🧪 Testing
You can test the API using tools like:

Postman

Insomnia

🙋‍♂️ Author
Yuvraj Gupta
📧 yuvrajguptaprivate@gmail.com (optional)

