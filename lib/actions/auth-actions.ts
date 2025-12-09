'use server';

import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/app/api/auth/authOptions";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import { z } from "zod";
import { emailService } from "@/lib/email";
import { generateToken } from "@/lib/utils";

// Schema for user registration validation
const registerSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  surname: z.string().min(1, "Prenumele este obligatoriu"),
  username: z.string().min(3, "Numele de utilizator trebuie să aibă cel puțin 3 caractere"),
  email: z.string().email("Adresa de email este invalidă"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
});

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email("Adresa de email este invalidă"),
  password: z.string().min(1, "Parola este obligatorie"),
});

// Schema for password reset request
const resetPasswordRequestSchema = z.object({
  email: z.string().email("Adresa de email este invalidă"),
});

// Schema for password reset
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token-ul este obligatoriu"),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere"),
});

export async function registerUser(formData: FormData) {
  try {
    console.log("Starting user registration process...");
    
    // Validate input
    const validatedFields = registerSchema.parse({
      name: formData.get("name"),
      surname: formData.get("surname"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    console.log("Registration data validated successfully");
    console.log("Connecting to database...");
    
    await dbConnect();
    console.log("Database connection established");

    // Check if user already exists
    console.log("Checking for existing user...");
    const existingUser = await User.findOne({
      $or: [
        { email: validatedFields.email },
        { username: validatedFields.username },
      ],
    });

    if (existingUser) {
      console.log("User already exists:", existingUser.email);
      if (existingUser.email === validatedFields.email) {
        return { success: false, message: "Acest email este deja folosit" };
      }
      if (existingUser.username === validatedFields.username) {
        return { success: false, message: "Acest nume de utilizator este deja luat" };
      }
    }

    // Create new user
    console.log("Creating new user...");
    const newUser = await User.create({
      name: validatedFields.name,
      surname: validatedFields.surname,
      username: validatedFields.username,
      email: validatedFields.email,
      password: validatedFields.password, // Will be hashed by the pre-save hook
      oauth_provider: null,
      sign_up_date: new Date(),
      address: [],
      orders: [],
    });
    console.log("User created successfully:", newUser._id.toString());

    // Send welcome email
    console.log("Attempting to send welcome email...");
    const emailResult = await emailService.sendWelcomeEmail(
      validatedFields.name,
      validatedFields.email
    );

    if (!emailResult.success) {
      console.warn("Failed to send welcome email:", emailResult.error);
      // Continue with registration even if email fails
    } else {
      console.log("Welcome email sent successfully");
    }

    return {
      success: true,
      message: "Înregistrare reușită",
      userId: newUser._id.toString(),
    };
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return { success: false, message: errorMessage };
    }
    return { success: false, message: "A apărut o eroare în timpul înregistrării" };
  }
}

export async function loginUser(formData: FormData) {
  try {
    // Validate input
    const validatedFields = loginSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    // Connect to database
    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email: validatedFields.email });
    
    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(validatedFields.password, user.password))) {
      return { success: false, message: "Datele de autentificare sunt invalide" };
    }

    // Simulate setting the session - the actual session will be set by the client-side signIn call
    return { success: true, message: "Autentificare reușită" };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return { success: false, message: errorMessage };
    }
    return { success: false, message: "A apărut o eroare în timpul autentificării" };
  }
}

export async function requestPasswordReset(formData: FormData) {
  try {
    console.log("Starting password reset request process...");
    
    // Validate input
    const validatedFields = resetPasswordRequestSchema.parse({
      email: formData.get("email"),
    });

    console.log("Password reset data validated, connecting to database...");
    await dbConnect();

    // Check if user exists
    console.log("Checking if user exists:", validatedFields.email);
    const user = await User.findOne({ email: validatedFields.email });
    if (!user) {
      console.log("User not found with email:", validatedFields.email);
      // Don't reveal if email exists for security reasons
      return { success: true, message: "Dacă emailul tău este înregistrat, vei primi un link pentru resetarea parolei" };
    }

    // Generate a reset token (expires in 1 hour)
    console.log("Generating reset token...");
    const resetToken = generateToken();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to user
    console.log("Saving reset token to user...");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send password reset email
    console.log("Sending password reset email...");
    const emailResult = await emailService.sendPasswordResetEmail(
      validatedFields.email,
      resetToken
    );

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      return { success: false, message: "Nu s-a putut trimite emailul de resetare. Te rugăm să încerci din nou mai târziu." };
    }

    console.log("Password reset email sent successfully");
    return { 
      success: true, 
      message: "Dacă emailul tău este înregistrat, vei primi un link pentru resetarea parolei" 
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return { success: false, message: errorMessage };
    }
    return { 
      success: false, 
      message: "A apărut o eroare. Te rugăm să încerci din nou mai târziu." 
    };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    console.log("Starting password reset process...");
    
    // Validate input
    const validatedFields = resetPasswordSchema.parse({
      token: formData.get("token"),
      password: formData.get("password"),
    });

    console.log("Password reset data validated, connecting to database...");
    await dbConnect();

    // Find user with valid token
    console.log("Finding user with valid token...");
    const user = await User.findOne({
      resetPasswordToken: validatedFields.token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log("No user found with valid token");
      return { 
        success: false, 
        message: "Token-ul de resetare a parolei este invalid sau a expirat" 
      };
    }

    // Update password and clear reset token
    console.log("Updating password for user:", user.email);
    user.password = validatedFields.password; // Will be hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log("Password updated successfully");

    return { 
      success: true, 
      message: "Parola ta a fost actualizată. Acum te poți autentifica cu noua parolă." 
    };
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => e.message).join(", ");
      return { success: false, message: errorMessage };
    }
    return { 
      success: false, 
      message: "A apărut o eroare. Te rugăm să încerci din nou mai târziu." 
    };
  }
}

export async function checkUsernameAvailability(username: string) {
  try {
    await dbConnect();
    const existingUser = await User.findOne({ username });
    return { available: !existingUser };
  } catch (error) {
    console.error("Username check error:", error);
    return { available: false, error: "Nu s-a putut verifica disponibilitatea numelui de utilizator" };
  }
}

export async function checkEmailAvailability(email: string) {
  try {
    await dbConnect();
    const existingUser = await User.findOne({ email });
    return { available: !existingUser };
  } catch (error) {
    console.error("Email check error:", error);
    return { available: false, error: "Nu s-a putut verifica disponibilitatea adresei de email" };
  }
} 