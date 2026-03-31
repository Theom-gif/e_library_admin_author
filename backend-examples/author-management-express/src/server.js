import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import authorsRouter from "./routes/authors.routes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const uploadsRoot = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsRoot, { recursive: true });

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsRoot));
app.use(authorsRouter);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Author management API is healthy." });
});

app.use((error, _req, res, _next) => {
  if (error?.message === "Only image uploads are allowed.") {
    res.status(422).json({
      success: false,
      message: error.message,
      errors: {
        profile_image: [error.message],
      },
    });
    return;
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    res.status(422).json({
      success: false,
      message: "Profile image must be smaller than 5MB.",
      errors: {
        profile_image: ["Profile image must be smaller than 5MB."],
      },
    });
    return;
  }

  console.error("Unhandled server error:", error);
  res.status(500).json({
    success: false,
    message: "Something went wrong.",
  });
});

app.listen(port, () => {
  console.log(`Author management API listening on http://localhost:${port}`);
});
