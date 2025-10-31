import { Request, Response } from 'express';
import { uploadImage } from '../config/cloudinary';
import User from '../models/User';

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId } = req.body;

    // Upload to Cloudinary
    const imageUrl = await uploadImage(req.file.buffer, 'codepro/profiles');

    // Update user profile image
    await User.findByIdAndUpdate(userId, {
      profileImage: imageUrl,
    });

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};