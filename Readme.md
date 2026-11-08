# Lab 3 – Books Management REST API

## Project Overview

The Books Management REST API is a backend application developed using **Node.js, Express.js, and SQLite**. It allows users to manage book records through RESTful API endpoints.

The application supports creating, retrieving, updating, and deleting book records. It also provides search, sorting, pagination, and price filtering features.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript
- Postman
- Git and GitHub

## Features

- Retrieve all books.
- Retrieve a specific book using its ID.
- Add new books.
- Update existing book details.
- Delete books.
- Search books by title.
- Sort books by different columns.
- Filter books using minimum and maximum prices.
- Implement pagination using limit and offset.
- Validate user inputs.
- Handle errors with appropriate HTTP status codes.

## Project Structure

```text
lab_3_rest_api/
│
├── server.js
├── server_backup.js
├── database.db
├── package.json
├── package-lock.json
│
└── postman/
    └── collections/
        └── Lab 3 - Books Management REST API/
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/kakumanicharitha34-png/lab_3_rest_api.git
```

### 2. Navigate to the project folder

```bash
cd lab_3_rest_api
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm run dev
```

Or:

```bash
node server.js
```

The server runs at:

```text
http://localhost:3000/
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books/` | Get all books |
| GET | `/books/:bookId/` | Get a book by ID |
| POST