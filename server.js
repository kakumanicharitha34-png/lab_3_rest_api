
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "database.db");
let db;

// HOME PAGE
app.get("/", (req, res) => {
  res.send(`
    <h1>Books Management API - Lab 3</h1>
    <h3>Server is running successfully!</h3>

    <h3>Available API Endpoints</h3>
    <ul>
      <li>GET /books/ - Get all books</li>
      <li>GET /books/:bookId/ - Get book by ID</li>
      <li>POST /books/ - Add a new book</li>
      <li>PUT /books/:bookId/ - Update a book</li>
      <li>DELETE /books/:bookId/ - Delete a book</li>
    </ul>
  `);
});

// GET ALL BOOKS WITH SEARCH, SORTING, PAGINATION AND PRICE FILTER
app.get("/books/", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price
    } = req.query;

    // Validate search
    if (typeof search_q !== "string") {
      return res.status(400).json({
        message: "search_q must be a string"
      });
    }

    // Validate sorting column
    const allowedColumns = [
      "id",
      "title",
      "author",
      "price",
      "pages"
    ];

    if (!allowedColumns.includes(order_by)) {
      return res.status(400).json({
        message: "Invalid order_by column"
      });
    }

    // Validate sorting order
    const sortOrder = order.toUpperCase();

    if (!["ASC", "DESC"].includes(sortOrder)) {
      return res.status(400).json({
        message: "Order must be ASC or DESC"
      });
    }

    // Validate limit and offset
    const limitValue = Number(limit);
    const offsetValue = Number(offset);

    if (
      !Number.isInteger(limitValue) ||
      limitValue <= 0 ||
      !Number.isInteger(offsetValue) ||
      offsetValue < 0
    ) {
      return res.status(400).json({
        message: "Invalid limit or offset"
      });
    }

    const conditions = [];
    const params = [];

    // Search books by title
    if (search_q.trim() !== "") {
      conditions.push("title LIKE ?");
      params.push(`%${search_q.trim()}%`);
    }

    // Minimum price filter
    if (min_price !== undefined) {
      const minValue = Number(min_price);

      if (
        typeof min_price !== "string" ||
        min_price.trim() === "" ||
        !Number.isFinite(minValue) ||
        minValue < 0
      ) {
        return res.status(400).json({
          message: "Invalid minimum price"
        });
      }

      conditions.push("price >= ?");
      params.push(minValue);
    }

    // Maximum price filter
    if (max_price !== undefined) {
      const maxValue = Number(max_price);

      if (
        typeof max_price !== "string" ||
        max_price.trim() === "" ||
        !Number.isFinite(maxValue) ||
        maxValue < 0
      ) {
        return res.status(400).json({
          message: "Invalid maximum price"
        });
      }

      conditions.push("price <= ?");
      params.push(maxValue);
    }

    // Check price range
    if (
      min_price !== undefined &&
      max_price !== undefined &&
      Number(min_price) > Number(max_price)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot exceed maximum price"
      });
    }

    let sql = "SELECT * FROM book";

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    // Sorting and pagination
    sql += ` ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`;

    params.push(limitValue, offsetValue);

    const books = await db.all(sql, params);

    res.status(200).json(books);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// GET BOOK BY ID
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!/^[1-9]\d*$/.test(bookId)) {
      return res.status(400).json({
        message: "Invalid book ID"
      });
    }

    const book = await db.get(
      "SELECT * FROM book WHERE id = ?",
      [bookId]
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.status(200).json(book);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// POST - ADD NEW BOOK WITH VALIDATION
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body || {};

    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    if (typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message: "Author is required"
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number"
      });
    }

    if (!Number.isInteger(pages) || pages <= 0) {
      return res.status(400).json({
        message: "Pages must be a positive integer"
      });
    }

    const result = await db.run(
      `INSERT INTO book (title, author, price, pages)
       VALUES (?, ?, ?, ?)`,
      [title.trim(), author.trim(), price, pages]
    );

    res.status(201).json({
      message: "Book added successfully",
      bookId: result.lastID
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// PUT - UPDATE BOOK
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body || {};

    if (!/^[1-9]\d*$/.test(bookId)) {
      return res.status(400).json({
        message: "Invalid book ID"
      });
    }

    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        message: "Title is required"
      });
    }

    if (typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({
        message: "Author is required"
      });
    }

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        message: "Invalid price"
      });
    }

    if (!Number.isInteger(pages) || pages <= 0) {
      return res.status(400).json({
        message: "Pages must be a positive integer"
      });
    }

    const result = await db.run(
      `UPDATE book
       SET title = ?, author = ?, price = ?, pages = ?
       WHERE id = ?`,
      [title.trim(), author.trim(), price, pages, bookId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.status(200).json({
      message: "Book updated successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// DELETE BOOK
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!/^[1-9]\d*$/.test(bookId)) {
      return res.status(400).json({
        message: "Invalid book ID"
      });
    }

    const result = await db.run(
      "DELETE FROM book WHERE id = ?",
      [bookId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.status(200).json({
      message: "Book deleted successfully"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// HANDLE INVALID JSON AND OTHER ERRORS
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  console.error(error);

  res.status(500).json({
    message: "Internal server error"
  });
});

// INITIALIZE DATABASE AND START SERVER
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });

  } catch (error) {
    console.error("Database Error:", error.message);
    process.exit(1);
  }
};

initializeDBAndServer();
