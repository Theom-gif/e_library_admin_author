import { Router } from "express";
import { createAuthor, listAuthors } from "../controllers/authors.controller.js";
import { uploadAuthorImage } from "../middleware/upload.js";

const router = Router();

router.get("/authors", listAuthors);
router.post("/authors", uploadAuthorImage.single("profile_image"), createAuthor);

export default router;
