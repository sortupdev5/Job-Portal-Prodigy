import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

const mapClerkUserToDb = (clerkUser) => ({
  _id: clerkUser.id,
  email: clerkUser.emailAddresses[0]?.emailAddress || "",
  name:
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
  image: clerkUser.imageUrl || "",
  resume: "",
});

export const getOrCreateUser = async (userId) => {
  const existingUser = await User.findById(userId);
  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const userData = mapClerkUserToDb(clerkUser);

  try {
    return await User.create(userData);
  } catch (error) {
    if (error.code === 11000) {
      return User.findById(userId);
    }
    throw error;
  }
};
