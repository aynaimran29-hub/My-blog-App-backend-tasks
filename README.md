# Blog App Backend

Backend API for the Blog App, built during my internship. It handles user registration, login, and blog data.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- bcryptjs (password hashing)
- body-parser

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/aynaimran29-hub/My-blog-App-backend-tasks.git
cd My-blog-App-backend-tasks
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root folder

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

4. Start the server

```bash
node index.js
```

## Project Structure

```
backend/
├── models/        # Database models
├── index.js       # Server entry point
├── test.http      # API test requests
└── package.json
```

## Frontend

The frontend of this project is here:
https://github.com/aynaimran29-hub/My-blog-App-

## Author

Amna Imran
