import bcrypt from "bcryptjs";
import path from "path";
import pool from "../db/pool.js";

function buildImageUrl(req, profileImagePath) {
  if (!profileImagePath) return null;
  return `${req.protocol}://${req.get("host")}/${profileImagePath.replace(/\\/g, "/")}`;
}

function mapAuthor(req, row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    bio: row.bio,
    profile_image: row.profile_image,
    profile_image_url: buildImageUrl(req, row.profile_image),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

function validateAuthorPayload({ name, email, password, bio }) {
  const errors = {};
  const trimmedName = String(name || "").trim();
  const trimmedEmail = String(email || "").trim().toLowerCase();

  if (!trimmedName) {
    errors.name = ["Name is required."];
  } else if (trimmedName.length < 2) {
    errors.name = ["Name must be at least 2 characters."];
  }

  if (!trimmedEmail) {
    errors.email = ["Email is required."];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = ["Email format is invalid."];
  }

  if (!password) {
    errors.password = ["Password is required."];
  } else if (String(password).length < 8) {
    errors.password = ["Password must be at least 8 characters."];
  }

  if (bio && String(bio).length > 500) {
    errors.bio = ["Bio cannot exceed 500 characters."];
  }

  return {
    errors,
    values: {
      name: trimmedName,
      email: trimmedEmail,
      password: String(password || ""),
      bio: String(bio || "").trim() || null,
    },
  };
}

export async function listAuthors(req, res) {
  try {
    const search = String(req.query.search || "").trim();
    const like = `%${search}%`;

    const [rows] = search
      ? await pool.query(
          `SELECT id, name, email, bio, profile_image, is_active, created_at
           FROM authors
           WHERE name LIKE ? OR email LIKE ?
           ORDER BY created_at DESC`,
          [like, like],
        )
      : await pool.query(
          `SELECT id, name, email, bio, profile_image, is_active, created_at
           FROM authors
           ORDER BY created_at DESC`,
        );

    res.json({
      success: true,
      data: rows.map((row) => mapAuthor(req, row)),
      message: "Authors fetched successfully.",
    });
  } catch (error) {
    console.error("GET /authors failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch authors.",
    });
  }
}

export async function createAuthor(req, res) {
  const { errors, values } = validateAuthorPayload(req.body);

  if (Object.keys(errors).length > 0) {
    res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
    return;
  }

  try {
    const [[existingAuthor]] = await pool.query(
      "SELECT id FROM authors WHERE email = ? LIMIT 1",
      [values.email],
    );

    if (existingAuthor) {
      res.status(422).json({
        success: false,
        message: "Validation failed.",
        errors: {
          email: ["Email has already been taken."],
        },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(values.password, 10);
    const profileImage = req.file
      ? path.posix.join("uploads", "authors", path.basename(req.file.path))
      : null;

    const [result] = await pool.query(
      `INSERT INTO authors (name, email, password_hash, bio, profile_image, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [values.name, values.email, passwordHash, values.bio, profileImage, 1],
    );

    const [[author]] = await pool.query(
      `SELECT id, name, email, bio, profile_image, is_active, created_at
       FROM authors
       WHERE id = ? LIMIT 1`,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      data: mapAuthor(req, author),
      message: "Author created successfully.",
    });
  } catch (error) {
    console.error("POST /authors failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create author.",
    });
  }
}
