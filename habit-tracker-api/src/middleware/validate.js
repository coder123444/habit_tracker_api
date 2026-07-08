const { z } = require("zod");

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const habitSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  frequency: z.enum(["daily", "weekly"]).optional(),
});

// Generic middleware factory: validates req.body against a given Zod schema
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { signupSchema, loginSchema, habitSchema, validateBody };
