# 📚 elysium

A full-stack web application for managing your personal book collection, discovering new reads, and connecting with other book lovers. Built with React, Express, MongoDB, and the Open Library API.

## ✨ Features

### 📖 Book Management
- **Search Books**: Search millions of books using the Open Library API
- **Multiple Libraries**: Organize books into five customizable libraries:
  - 📚 To Read
  - 📖 Currently Reading
  - ✅ Read
  - ⏸️ Paused
  - 🚫 DNF (Did Not Finish)
- **Easy Organization**: Move books between libraries with a simple dropdown
- **Book Covers**: Automatic cover art fetching from Open Library

### ⭐ Ratings & Reviews
- **5-Star Rating System**: Rate books you've read with an intuitive star interface
- **Smart Rating**: Rating a book automatically adds it to your Read library
- **Automatic Organization**: Books move to Read when rated, regardless of current library

### 👤 User Profiles
- **Public Profiles**: Share your reading journey with others
- **Profile Customization**:
  - Display name and bio
  - Profile picture/avatar
  - Location and website
  - Favorite genres
  - Privacy settings (public/private)
- **Reading Stats**: Track your reading progress with automatic statistics
- **Library Display**: Showcase your book collections on your profile

### 🔍 Social Features
- **User Search**: Find and connect with other readers
- **Profile Discovery**: Browse other users' reading lists
- **Reading Statistics**: View total books, books read, and current reading progress

### 🔐 Authentication & Security
- **User Authentication**: Secure registration and login system
- **JWT Tokens**: Secure session management with JSON Web Tokens
- **Password Hashing**: Passwords encrypted with bcrypt
- **Protected Routes**: Private user data and libraries

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP requests
- **CSS** - Styling and animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### APIs
- **Open Library API** - Book search and metadata

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Cloud database

## 📁 Project Structure
```
book-library-app/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # React components
│       │   ├── Login.js
│       │   ├── Register.js
│       │   ├── Profile.js
│       │   ├── EditProfile.js
│       │   ├── UserSearch.js
│       │   ├── StarRating.js
│       │   └── *.css
│       ├── context/        # React context (Auth)
│       ├── App.js          # Main app component
│       ├── App.css
│       └── index.js
│
└── server/                 # Express backend
    ├── models/             # Mongoose models
    │   ├── User.js
    │   └── Library.js
    ├── middleware/         # Custom middleware
    │   └── auth.js
    ├── index.js            # Server entry point
    └── .env                # Environment variables
```

## 🎨 Features in Detail

### Book Rating System
- Rate books from 1-5 stars
- Interactive star UI with hover effects
- Rating a book automatically adds it to "Read" library
- Update ratings anytime from your Read library
- Ratings display on your public profile

### Library Management
- Drag-free organization with dropdown menus
- Move books between any libraries
- Remove books completely
- Automatic book data fetching (title, author, cover, year)

### User Profiles
- Customizable display name and bio (up to 500 characters)
- Avatar support via URL
- Location and website fields
- Public/private toggle for profile visibility
- Reading statistics dashboard

## 📝 Future Enhancements

- [ ] Book reviews
- [ ] Friend system and social feed
- [ ] Reading goals and challenges
- [ ] Book recommendations based on reading history
- [ ] Reading statistics and analytics
- [ ] Mobile app (React Native)
- [ ] Book clubs and group reading lists

## 🐛 Known Issues

- Free tier hosting may experience cold starts (30 seconds on first request)
- Book covers may not be available for all titles
- Search results limited to Open Library database

## 👨‍💻 Author

**Your Name**
- GitHub: [@mnbarber](https://github.com/mnbarber)

## 🙏 Acknowledgments

- [Open Library](https://openlibrary.org/) for the book data API
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- [Vercel](https://vercel.com/) for frontend hosting
- [Render](https://render.com/) for backend hosting

## 📧 Contact

Have questions or suggestions? Feel free to reach out or open an issue!
