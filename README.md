# Image Gallery - Next.js App

A modern image gallery web application built with Next.js, TypeScript, Tailwind CSS, MongoDB, and Cloudinary.

## Features

- **Public Homepage** (`/`): Beautiful responsive gallery displaying uploaded images
- **Admin Panel** (`/admin`): Upload, preview, and manage images
- **Image Upload**: Drag-and-drop or click to upload images to Cloudinary
- **Image Management**: Delete images with one click
- **Database**: MongoDB Atlas stores image URLs and Cloudinary public IDs
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **Image Host**: Cloudinary
- **UI Components**: React with server components

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18+) and npm installed
2. **MongoDB Atlas** account with a database connection string
3. **Cloudinary** account with API credentials

## Setup Guide

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account and a free cluster.
2. Create a database user with read and write access.
3. Add your IP address to the network access list.
4. Copy your connection string from Atlas.
5. Paste it into `MONGODB_URI` in your local environment file.

### 3. Set Up Cloudinary

1. Create a Cloudinary account and open the Dashboard.
2. Copy your Cloud Name, API Key, and API Secret.
3. Paste them into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required variables:

- `MONGODB_URI`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_PASSWORD`

### 5. Run the App Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public gallery and [http://localhost:3000/admin](http://localhost:3000/admin) for admin access.

### 6. Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables in the Vercel project settings.
4. Deploy the app.
5. Use the Vercel deployment URL to access the public gallery and `/admin`.

## Environment Variables

Create a `.env.local` file in the root directory with your credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/image_gallery?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_PASSWORD=choose_a_strong_private_password
```

**Getting Credentials:**

#### MongoDB Atlas
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add a database user with a password
4. Click "Connect" and copy your connection string
5. Replace `username`, `password`, and `cluster` in the URI

#### Cloudinary
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to your Dashboard
3. Copy your `Cloud Name`, `API Key`, and `API Secret`
4. Paste them into `.env.local`

#### Admin Access
1. Choose a private password for `ADMIN_PASSWORD`
2. Use that password on the `/admin` page login form
3. The login is stored locally in the browser with `localStorage`

## Using the App

The public homepage is available at [http://localhost:3000](http://localhost:3000) and the admin panel is available at [http://localhost:3000/admin](http://localhost:3000/admin).

From the admin panel you can:
- Upload new images
- Preview an image before uploading
- View the current gallery
- Delete images you no longer want displayed

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── images/
│   │       ├── route.ts          # GET/POST/DELETE images
│   │       ├── upload/route.ts   # Upload to Cloudinary
│   │       └── delete/route.ts   # Delete from Cloudinary
│   ├── admin/
│   │   └── page.tsx              # Admin management page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage gallery
├── components/
│   ├── ImageGallery.tsx          # Gallery display component
│   └── ImageUpload.tsx           # Upload form component
└── lib/
    ├── mongodb.ts                # Database connection
    ├── cloudinary.ts             # Cloudinary utilities
    └── types.ts                  # TypeScript types
```

## API Endpoints

### GET `/api/images`
Fetch all images from the database

### POST `/api/images`
Save image metadata to MongoDB

### DELETE `/api/images?id={imageId}`
Delete image metadata from MongoDB

### POST `/api/images/upload`
Upload image to Cloudinary (multipart form data)

### POST `/api/images/delete`
Delete image from Cloudinary (requires publicId)

## Usage

### Upload an Image

1. Go to the Admin Panel (`/admin`)
2. Drag and drop an image or click to select
3. Add an optional title
4. Click "Upload Image"
5. Image is uploaded to Cloudinary and saved to MongoDB

### View Gallery

- Homepage displays all uploaded images in a responsive grid
- Images load from Cloudinary URLs
- Each image shows its title if available

### Delete an Image

1. Go to Admin Panel
2. Hover over an image in the gallery
3. Click "Delete" button
4. Confirm deletion
5. Image is removed from both Cloudinary and MongoDB

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Images not appearing
- Verify MongoDB connection string is correct
- Check Cloudinary API credentials
- Ensure both services are accessible from your network

### Upload failures
- Check that file is a valid image format (JPEG, PNG, GIF, WebP)
- Verify Cloudinary credentials have upload permissions
- Check browser console for error messages

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check that `.env.local` file exists and has all required variables
- Clear Next.js cache: `rm -rf .next` (or delete `.next` folder on Windows)

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `ADMIN_PASSWORD` | Yes | Password for the `/admin` page |

## License

MIT
